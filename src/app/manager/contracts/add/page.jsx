"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import ContractForm from "@/components/contracts/ContractForm";
import { createContract } from "@/services/contractService";
import "@/styles/add-contract-page.css";
import Link from "next/link";

export default function AddContractPage() {
  const router = useRouter();
  const { data: session } = useSession();

  async function handleCreateContract(formData) {
    try {
      const response = await createContract({
        ...formData,
        manager: session?.user?.id,
      });

      if (response.success) {
        router.push("/manager/contracts");
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create contract");
    }
  }

  return (
    <div className="add-contract-page">
      <Link href="/manager/contracts" className="back-link">
        ← Back to Contracts
      </Link>
      <div className="page-title">
        <h1>Create Contract</h1>

        <p>Create a new property sale contract</p>
      </div>

      <div className="contract-form-card">
        <ContractForm
          onSubmit={handleCreateContract}
          submitText="Create Contract"
        />
      </div>
    </div>
  );
}
