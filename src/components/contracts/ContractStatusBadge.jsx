"use client";
import "@/styles/contract-status-badge.css";
export default function ContractStatusBadge({ status }) {
  return (
    <span className={`contract-status ${status}`}>
      {status.replace("_", " ")}
    </span>
  );
}
