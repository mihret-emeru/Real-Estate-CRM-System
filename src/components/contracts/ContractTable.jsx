"use client";

import Link from "next/link";

import { FaEye, FaEdit, FaTrash, FaUpload, FaDownload } from "react-icons/fa";

export default function ContractActions({ contract, onDelete }) {
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
