"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import "@/styles/client/contract-details.css";

export default function ClientContractDetailsPage() {
  const { id } = useParams();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await fetch(`/api/contracts/${id}`);
        const data = await response.json();
        console.log("🔥 CONTRACT DETAILS:", data.data);
        console.log("🔥 CLIENT SIGNATURE:", data.data?.clientSignature);
        console.log("🔥 CLIENT SIGNED AT:", data.data?.clientSignedAt);
        console.log("🔥 CONTRACT STATUS:", data.data?.status);

        if (data.success) {
          setContract(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch contract:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchContract();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="client-contract-details-page">
        <p>Loading contract...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="client-contract-details-page">
        <h2>Contract not found.</h2>

        <Link href="/client/contracts">← Back to Contracts</Link>
      </div>
    );
  }

  const isGenerated = contract.contractType === "generated";
  const isPending = contract.status === "pending_signature";
  const isSigned =
    contract.status === "signed" || contract.status === "completed";

  const hasUploadedDocument = Boolean(contract.document?.fileUrl);

  return (
    <div className="client-contract-details-page">
      {/* Header */}

      <div className="contract-details-header">
        <div>
          <Link href="/client/contracts" className="contract-back-link">
            ← Back to Contracts
          </Link>

          <h1>{contract.contractNumber || "Contract"}</h1>

          <p>{contract.property?.title || "Property Contract"}</p>
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

      {/* Contract information */}

      <div className="contract-summary-card">
        <div>
          <span>Contract Number</span>
          <strong>{contract.contractNumber || "-"}</strong>
        </div>

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
      </div>

      {/* Generated contract */}

      {isGenerated && (
        <div className="generated-contract">
          <div className="generated-contract-header">
            <div>
              <span>REAL ESTATE CONTRACT</span>

              <h2>{contract.contractNumber}</h2>
            </div>

            <span className="generated-contract-label">Generated</span>
          </div>

          <div className="contract-document">
            <h3>Property Sale Agreement</h3>

            <p>
              This agreement confirms the sale of the property listed below
              between the parties identified in this contract.
            </p>

            <div className="document-section">
              <h4>Property</h4>

              <p>
                <strong>Name:</strong> {contract.property?.title || "-"}
              </p>

              <p>
                <strong>Sale Price:</strong>{" "}
                {Number(contract.salePrice || 0).toLocaleString()} ETB
              </p>
            </div>

            <div className="document-section">
              <h4>Financial Terms</h4>

              <p>
                <strong>Down Payment:</strong>{" "}
                {Number(contract.downPayment || 0).toLocaleString()} ETB
              </p>

              <p>
                <strong>Remaining Balance:</strong>{" "}
                {Number(contract.remainingBalance || 0).toLocaleString()} ETB
              </p>

              {contract.installmentMonths > 0 && (
                <p>
                  <strong>Installments:</strong> {contract.installmentMonths}{" "}
                  months
                </p>
              )}
            </div>

            {contract.terms && (
              <div className="document-section">
                <h4>Terms and Conditions</h4>

                <p>{contract.terms}</p>
              </div>
            )}

            {/* Signature */}

            <div className="contract-signature-section">
              <div>
                <h4>Client Signature</h4>

                {isSigned ? (
                  contract.clientSignature ? (
                    <img
                      src={contract.clientSignature}
                      alt="Client signature"
                      className="client-signature-image"
                    />
                  ) : (
                    <div className="signature-placeholder">Signed</div>
                  )
                ) : (
                  <div className="signature-placeholder">Not signed yet</div>
                )}

                <p>{contract.client?.name || "Client"}</p>
              </div>

              <div>
                <h4>Manager</h4>

                <div className="manager-signature-line">
                  {contract.manager?.name || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Generated contract actions */}

          <div className="contract-document-actions">
            {isPending && (
              <Link
                href={`/client/contracts/${contract._id}/sign`}
                className="contract-sign-btn"
              >
                Sign Contract
              </Link>
            )}

            {isSigned && (
              <a
                href={`/api/contracts/${contract._id}/download`}
                className="contract-download-btn"
              >
                Download Contract
              </a>
            )}
          </div>
        </div>
      )}

      {/* Uploaded contract */}

      {!isGenerated && hasUploadedDocument && (
        <div className="uploaded-contract">
          <div className="uploaded-contract-header">
            <div>
              <span>UPLOADED CONTRACT</span>

              <h2>{contract.document.fileName || "Contract Document"}</h2>
            </div>
          </div>

          <div className="uploaded-contract-actions">
            <a
              href={contract.document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="contract-view-btn"
            >
              View Contract
            </a>

            <a
              href={contract.document.fileUrl}
              download
              className="contract-download-btn"
            >
              Download Contract
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
