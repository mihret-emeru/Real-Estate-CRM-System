"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/client/contracts.css";

export default function ClientContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const response = await fetch("/api/contracts");
        const data = await response.json();

        if (data.success) {
          setContracts(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, []);

  if (loading) {
    return (
      <div className="client-contracts-page">
        <div className="contracts-loading">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="client-contracts-page">
      <div className="contracts-header">
        <div>
          <h1>My Contracts</h1>

          <p>
            View your property contracts and sign contracts that require your
            signature.
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="contracts-empty">
          <h2>No contracts yet</h2>

          <p>
            Your contracts will appear here when a contract is created for you.
          </p>

          <Link href="/client/properties" className="contracts-browse-btn">
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="contracts-list">
          {contracts.map((contract) => {
            const isGenerated = contract.contractType === "generated";

            const isPending = contract.status === "pending_signature";

            const hasUploadedDocument = contract.document?.fileUrl;

            return (
              <div className="contract-card" key={contract._id}>
                <div className="contract-card-header">
                  <div>
                    <span className="contract-label">Contract</span>

                    <h2>{contract.contractNumber || "-"}</h2>
                  </div>

                  <span className={`contract-status ${contract.status}`}>
                    {contract.status === "pending_signature"
                      ? "Pending Signature"
                      : contract.status === "signed"
                        ? "Signed"
                        : contract.status === "completed"
                          ? "Completed"
                          : "Cancelled"}
                  </span>
                </div>

                <div className="contract-details">
                  <div>
                    <span>Property</span>

                    <strong>{contract.property?.title || "-"}</strong>
                  </div>

                  <div>
                    <span>Contract Type</span>

                    <strong>
                      {isGenerated ? "Generated Contract" : "Uploaded Contract"}
                    </strong>
                  </div>

                  <div>
                    <span>Sale Price</span>

                    <strong>
                      {Number(contract.salePrice || 0).toLocaleString()} ETB
                    </strong>
                  </div>

                  <div>
                    <span>Created</span>

                    <strong>
                      {contract.createdAt
                        ? new Date(contract.createdAt).toLocaleDateString()
                        : "-"}
                    </strong>
                  </div>
                </div>

                <div className="contract-actions">
                  {isGenerated && isPending && (
                    <Link
                      href={`/client/contracts/${contract._id}/sign`}
                      className="contract-sign-btn"
                    >
                      Sign Contract
                    </Link>
                  )}

                  <Link
                    href={`/client/contracts/${contract._id}`}
                    className="contract-view-btn"
                  >
                    View Contract
                  </Link>

                  {hasUploadedDocument && (
                    <a
                      href={contract.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contract-download-btn"
                    >
                      Download Contract
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
