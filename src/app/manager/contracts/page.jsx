"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getContracts, deleteContract } from "@/services/contractService";

import ContractSummaryCards from "@/components/contracts/ContractSummaryCards";
import ContractTable from "@/components/contracts/ContractTable";

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);

  async function loadContracts() {
    const data = await getContracts();

    if (data.success) {
      setContracts(data.data);
    }
  }

  useEffect(() => {
    loadContracts();
  }, []);

  // 👇 ADD IT HERE
  async function handleDelete(id) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this contract?",
    );

    if (!confirmDelete) return;

    const result = await deleteContract(id);

    if (result.success) {
      loadContracts();
    }
  }

  return (
    <div className="contracts-page">
      <div className="page-title">
        <div>
          <h1>Contracts</h1>

          <p>Manage property sale contracts</p>
        </div>

        <div className="page-actions">
          <Link href="/manager/contracts/add">
            <button className="primary-btn">+ Create Contract</button>
          </Link>

          <Link href="/manager/contracts/upload">
            <button className="secondary-btn">+ Upload Signed Contract</button>
          </Link>
        </div>
      </div>

      <ContractSummaryCards contracts={contracts} />

      <ContractTable contracts={contracts} onDelete={handleDelete} />
    </div>
  );
}
