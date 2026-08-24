"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

import "@/styles/client/contract-sign.css";

export default function ClientContractSignPage() {
  const { id } = useParams();
  const router = useRouter();

  const signatureRef = useRef(null);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchContract() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/contracts/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load contract.");
        }

        const contractData = data.data;

        /*
         * Only generated contracts should reach
         * the online signing page.
         */

        if (contractData.contractType !== "generated") {
          throw new Error("This contract does not require online signing.");
        }

        if (contractData.status !== "pending_signature") {
          throw new Error(
            contractData.status === "signed"
              ? "This contract has already been signed."
              : "This contract cannot be signed.",
          );
        }

        setContract(contractData);
      } catch (error) {
        console.error("Failed to fetch contract:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchContract();
    }
  }, [id]);

  function clearSignature() {
    signatureRef.current?.clear();
  }

  async function handleSignContract() {
    setError("");

    if (!signatureRef.current) {
      setError("Signature area is unavailable.");
      return;
    }

    if (signatureRef.current.isEmpty()) {
      setError("Please provide your signature.");
      return;
    }

    if (!agreed) {
      setError("Please confirm that you agree to sign this contract.");
      return;
    }

    try {
      setSigning(true);

      /*
       * Convert the drawn signature into a PNG data URL.
       */

      const signature = signatureRef.current.toDataURL("image/png");

      const response = await fetch(`/api/contracts/${id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sign contract.");
      }

      /*
       * Contract has now been signed successfully.
       */

      router.push("/client/contracts");
    } catch (error) {
      console.error("Contract signing failed:", error);
      setError(error.message);
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="contract-sign-page">
        <div className="contract-sign-loading">Loading contract...</div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="contract-sign-page">
        <div className="contract-sign-error">
          <h2>Unable to Sign Contract</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => router.push("/client/contracts")}
          >
            Back to Contracts
          </button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="contract-sign-page">
      <div className="contract-sign-container">
        {/* Header */}

        <div className="contract-sign-header">
          <button
            type="button"
            className="contract-back-btn"
            onClick={() => router.push("/client/contracts")}
          >
            ← Back to Contracts
          </button>

          <div>
            <h1>Sign Contract</h1>

            <p>Review the contract carefully before signing.</p>
          </div>
        </div>

        {/* Contract Information */}

        <div className="contract-summary-card">
          <div>
            <span>Contract Number</span>
            <strong>{contract.contractNumber}</strong>
          </div>

          <div>
            <span>Property</span>
            <strong>{contract.property?.title || "-"}</strong>
          </div>

          <div>
            <span>Sale Price</span>
            <strong>
              {Number(contract.salePrice || 0).toLocaleString()}{" "}
              {contract.property?.currency || "ETB"}
            </strong>
          </div>
        </div>

        {/* Contract Document */}

        <section className="contract-document-card">
          <div className="contract-document-header">
            <h2>Contract Agreement</h2>

            <span>{contract.contractNumber}</span>
          </div>

          <div className="contract-document-content">
            <h3>Property Sale Agreement</h3>

            <p>
              This agreement is entered into between the property management
              company and the client identified in this contract.
            </p>

            <div className="contract-detail-row">
              <strong>Client:</strong>

              <span>{contract.client?.name || "-"}</span>
            </div>

            <div className="contract-detail-row">
              <strong>Email:</strong>

              <span>{contract.client?.email || "-"}</span>
            </div>

            <div className="contract-detail-row">
              <strong>Property:</strong>

              <span>{contract.property?.title || "-"}</span>
            </div>

            <div className="contract-detail-row">
              <strong>Sale Price:</strong>

              <span>
                {Number(contract.salePrice || 0).toLocaleString()}{" "}
                {contract.property?.currency || "ETB"}
              </span>
            </div>

            {contract.downPayment != null && (
              <div className="contract-detail-row">
                <strong>Down Payment:</strong>

                <span>
                  {Number(contract.downPayment || 0).toLocaleString()}{" "}
                  {contract.property?.currency || "ETB"}
                </span>
              </div>
            )}

            {contract.remainingBalance != null && (
              <div className="contract-detail-row">
                <strong>Remaining Balance:</strong>

                <span>
                  {Number(contract.remainingBalance || 0).toLocaleString()}{" "}
                  {contract.property?.currency || "ETB"}
                </span>
              </div>
            )}

            {contract.terms && (
              <div className="contract-terms">
                <h3>Terms and Conditions</h3>

                <p>{contract.terms}</p>
              </div>
            )}

            {contract.startDate && (
              <div className="contract-detail-row">
                <strong>Start Date:</strong>

                <span>{new Date(contract.startDate).toLocaleDateString()}</span>
              </div>
            )}

            {contract.endDate && (
              <div className="contract-detail-row">
                <strong>End Date:</strong>

                <span>{new Date(contract.endDate).toLocaleDateString()}</span>
              </div>
            )}

            <div className="contract-important-notice">
              <strong>Please review carefully.</strong>

              <p>
                By signing this contract, you confirm that you have reviewed the
                agreement and agree to its terms and conditions.
              </p>
            </div>
          </div>
        </section>

        {/* Signature */}

        <section className="signature-section">
          <div className="signature-section-header">
            <div>
              <h2>Your Signature</h2>

              <p>Draw your signature inside the box below.</p>
            </div>

            <button
              type="button"
              className="clear-signature-btn"
              onClick={clearSignature}
              disabled={signing}
            >
              Clear
            </button>
          </div>

          <div className="signature-pad-wrapper">
            <SignatureCanvas
              ref={signatureRef}
              penColor="#222"
              canvasProps={{
                className: "signature-pad",
              }}
            />
          </div>

          <p className="signature-hint">
            Sign using your mouse, trackpad, or touchscreen.
          </p>
        </section>

        {/* Agreement */}

        <div className="contract-agreement">
          <label>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              disabled={signing}
            />

            <span>
              I have reviewed this contract and agree to sign it electronically.
            </span>
          </label>
        </div>

        {/* Error */}

        {error && <div className="contract-sign-form-error">{error}</div>}

        {/* Sign */}

        <div className="contract-sign-actions">
          <button
            type="button"
            className="cancel-sign-btn"
            onClick={() => router.push("/client/contracts")}
            disabled={signing}
          >
            Cancel
          </button>

          <button
            type="button"
            className="sign-contract-btn"
            onClick={handleSignContract}
            disabled={signing || !agreed}
          >
            {signing ? "Signing Contract..." : "Sign Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
