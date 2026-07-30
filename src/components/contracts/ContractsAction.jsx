"use client";

import Link from "next/link";
import { FaEye, FaEdit, FaTrash, FaUpload, FaDownload } from "react-icons/fa";

export default function ContractActions({ contractId, onDelete }) {
  return (
    <div className="contract-actions">
      <Link
        href={`/manager/contracts/${contractId}`}
        className="contract-view-btn"
      >
        <FaEye />
      </Link>

      <Link
        href={`/manager/contracts/${contractId}/edit`}
        className="contract-edit-btn"
      >
        <FaEdit />
      </Link>

      <Link
        href={`/manager/contracts/${contractId}/upload`}
        className="contract-upload-btn"
      >
        <FaUpload />
      </Link>

      <button className="contract-download-btn">
        <FaDownload />
      </button>

      <button
        className="contract-delete-btn"
        onClick={() => onDelete(contractId)}
      >
        <FaTrash />
      </button>
    </div>
  );
}

