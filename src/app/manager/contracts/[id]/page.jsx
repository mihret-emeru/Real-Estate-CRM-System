"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getContract } from "@/services/contractService";
import ContractDetails from "@/components/contracts/ContractDetails";
import Link from "next/link";

export default function ContractPage() {
  const params = useParams();

  const [contract, setContract] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContract() {
      const response = await getContract(params.id);

      if (response.success) {
        setContract(response.data);
      }

      setLoading(false);
    }

    if (params?.id) {
      loadContract();
    }
  }, [params]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!contract) {
    return <p>Contract not found.</p>;
  }

  return (
    <div className="contract-details-page">
      <Link href="/manager/contracts" className="back-link">
        ← Back to Contracts
      </Link>

      <ContractDetails contract={contract} setContract={setContract} />
    </div>
  );
}

