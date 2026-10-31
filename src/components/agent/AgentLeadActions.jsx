"use client";

import Link from "next/link";
import { FaEye, FaEdit, FaComments } from "react-icons/fa";

export default function AgentLeadActions({ leadId }) {
  return (
    <div className="agent-lead-actions">
      <Link
        href={`/agent/leads/${leadId}`}
        className="agent-lead-view-btn"
        aria-label="View lead"
      >
        <FaEye />
      </Link>

      <Link
        href={`/agent/leads/${leadId}/edit`}
        className="agent-lead-edit-btn"
        aria-label="Edit lead"
      >
        <FaEdit />
      </Link>

      <Link
        href={`/agent/leads/${leadId}/message`}
        className="agent-lead-message-btn"
        aria-label="Message client"
      >
        <FaComments />
      </Link>
    </div>
  );
}
