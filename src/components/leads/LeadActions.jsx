"use client";

import Link from "next/link";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

export default function LeadActions({ leadId, onDelete }) {
  return (
    <div className="lead-actions">
      <Link href={`/manager/leads/${leadId}`} className="lead-view-btn">
        <FaEye />
      </Link>

      <Link href={`/manager/leads/${leadId}/edit`} className="lead-edit-btn">
        <FaEdit />
      </Link>

      <button className="lead-delete-btn" onClick={() => onDelete(leadId)}>
        <FaTrash />
      </button>
    </div>
  );
}
