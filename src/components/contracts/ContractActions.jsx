"use client";

import Link from "next/link";
import "@/styles/contract-actions.css";

import { FaEye, FaEdit, FaTrash, FaDownload, FaBan } from "react-icons/fa";

export default function ContractActions({ contract, onDelete }) {
  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this contract?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/contracts/${contract._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to cancel contract.");
    }
  }

  return (
    <div className="contract-actions">
      {/* View */}
      <Link
        href={`/manager/contracts/${contract._id}`}
        className="contract-view-btn"
      >
        <FaEye />
      </Link>

      {/* Generated Contract */}
      {contract.contractType === "generated" && (
        <Link
          href={`/manager/contracts/${contract._id}/edit`}
          className="contract-edit-btn"
        >
          <FaEdit />
        </Link>
      )}

      {/* Uploaded Contract */}
      {contract.contractType === "uploaded" && contract.document?.fileUrl && (
        <a
          href={contract.document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="contract-download-btn"
        >
          <FaDownload />
        </a>
      )}

      {/* Cancel */}
      {contract.status !== "cancelled" && contract.status !== "completed" && (
        <button
          type="button"
          className="contract-cancel-btn"
          onClick={handleCancel}
          title="Cancel Contract"
        >
          <FaBan />
        </button>
      )}

      {/* Delete */}
      <button
        className="contract-delete-btn"
        onClick={() => onDelete(contract._id)}
      >
        <FaTrash />
      </button>
    </div>
  );
}
