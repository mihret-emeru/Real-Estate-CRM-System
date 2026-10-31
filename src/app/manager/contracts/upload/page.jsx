"use client";

import { useRouter } from "next/navigation";
import ContractForm from "@/components/contracts/ContractForm";
import { uploadContractFile } from "@/services/uploadService";
import { createContract } from "@/services/contractService";
import "@/styles/upload-contract-page.css";
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
        property: formData.property,

        manager: session.user.id,

        contractType: "uploaded",

        status: "signed",
        salePrice: formData.salePrice,
        downPayment: formData.downPayment,
        remainingBalance: formData.remainingBalance,
        installmentMonths: formData.installmentMonths,
        installmentAmount: formData.installmentAmount,
        paymentFrequency: formData.paymentFrequency,
        paymentSchedule: formData.paymentSchedule,

        document: {
          fileName: uploadResult.data.fileName,

          fileUrl: uploadResult.data.fileUrl,

          mimeType: uploadResult.data.mimeType,

          uploadedAt: new Date(),
        },

        terms: formData.terms,

        startDate: formData.contractDate,
      };

      if (formData.client) {
        contractData.client = formData.client;
      }

      if (formData.lead) {
        contractData.lead = formData.lead;
      }

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
      <Link href="/manager/contracts" className="back-link">
        ← Back to Contracts
      </Link>
      <h1>Upload Signed Contract</h1>

      <ContractForm
        mode="uploaded"
        submitText="Upload Contract"
        onSubmit={handleUpload}
      />
    </div>
  );
}
