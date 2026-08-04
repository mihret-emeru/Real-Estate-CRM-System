"use client";

import { useRouter } from "next/navigation";
import ContractForm from "@/components/contracts/ContractForm";
import { uploadContractFile } from "@/services/uploadService";
import { createContract } from "@/services/contractService";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function UploadSignedContractPage() {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleUpload(formData) {
    try {
      if (!formData.contractFile) {
        alert("Please select a PDF file");
        return;
      }

      // Upload PDF to Cloudinary
      const uploadResult = await uploadContractFile(formData.contractFile);

      if (!uploadResult.success) {
        alert(uploadResult.message);
        return;
      }

      if (!session?.user?.id) {
        alert("Manager session not found.");
        return;
      }

      // Create uploaded contract
      const contractData = {
        client: formData.client,

        property: formData.property,

        manager: session.user.id,

        contractType: "uploaded",

        status: "signed",

        document: {
          fileName: uploadResult.data.fileName,

          fileUrl: uploadResult.data.fileUrl,

          mimeType: uploadResult.data.mimeType,

          uploadedAt: new Date(),
        },

        terms: formData.terms,

        startDate: formData.contractDate,
      };

      const response = await createContract(contractData);

      if (response.success) {
        alert("Signed contract uploaded successfully");

        router.push("/manager/contracts");
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);

      alert("Upload failed");
    }
  }

  return (
    <div className="page-container">
      <h1>Upload Signed Contract</h1>

      <Link href="/manager/contracts" className="back-link">
        ← Back to Contracts
      </Link>
      <ContractForm
        mode="uploaded"
        submitText="Upload Contract"
        onSubmit={handleUpload}
      />
    </div>
  );
}
