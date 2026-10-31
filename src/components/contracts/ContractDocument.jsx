"use client";

import Link from "next/link";
import "@/styles/contract-document.css";

export default function ContractDocument({ contract }) {
  if (contract.contractType !== "uploaded") {
    return null;
  }

  return (
    <div className="contract-document">
      <h2>Signed Contract</h2>

      <p>
        <strong>File:</strong> {contract.document.fileName}
      </p>

      <p>
        <strong>Uploaded:</strong>{" "}
        {new Date(contract.document.uploadedAt).toLocaleDateString()}
      </p>

      <div className="document-actions">
        <Link
          href={`/manager/contracts/${contract._id}/document`}
          className="view-document-btn"
        >
          View Document
        </Link>

        <a
          href={contract.document.fileUrl}
          download={contract.document.fileName}
          className="download-document-btn"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
