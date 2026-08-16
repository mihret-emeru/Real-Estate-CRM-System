"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import ContractForm from "@/components/contracts/ContractForm";
import { updateContract } from "@/services/contractService";

export default function EditContractPage() {
  const { id } = useParams();
  const router = useRouter();

  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function loadContract() {
      const response = await fetch(`/api/contracts/${id}`);

      const result = await response.json();

      if (result.success) {
        const data = result.data;

        setContract({
          ...data,

          client: data.client?._id || null,
          lead: data.lead?._id || null,
          property: data.property?._id || "",

          startDate: data.startDate ? data.startDate.substring(0, 10) : "",

          contractDate: data.startDate ? data.startDate.substring(0, 10) : "",
        });
      }
    }

    loadContract();
  }, [id]);

  async function handleUpdate(formData) {
    try {
      const response = await updateContract(id, formData);

      if (response.success) {
        router.push("/manager/contracts");
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  }

  if (!contract) {
    return <p>Loading...</p>;
  }

  return (
    <div className="edit-contract-page">
      <Link href="/manager/contracts" className="back-link">
        ← Back to Contracts
      </Link>

      <h1>Edit Contract</h1>

      <ContractForm
        initialData={contract}
        onSubmit={handleUpdate}
        submitText="Update Contract"
      />
    </div>
  );
}
