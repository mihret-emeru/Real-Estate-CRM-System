"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import {
  FaArrowLeft,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaUpload,
  FaCreditCard,
} from "react-icons/fa";

import "@/styles/client/payment-details.css";

export default function ClientPaymentDetailsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const paymentResult = searchParams.get("payment");
  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");

  const [payment, setPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [uploadMessage, setUploadMessage] = useState("");

  const [chapaLoading, setChapaLoading] = useState(false);

  // ============================================================
  // FETCH PAYMENT
  // ============================================================

  async function fetchPayment() {
    try {
      const response = await fetch(`/api/client/payments/${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load payment.");
      }

      setPayment(data.data);

      return data.data;
    } catch (error) {
      console.error("Failed to fetch payment:", error);

      setError(error.message);

      return null;
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  // ============================================================
  // LOAD / VERIFY PAYMENT
  // ============================================================

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function verifyChapaPayment(reference) {
      const response = await fetch(
        `/api/client/payments/${id}/chapa/verify?tx_ref=${encodeURIComponent(
          reference,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      console.log("CHAPA VERIFY RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Chapa payment could not be verified.");
      }

      return data;
    }

    async function loadPayment() {
      setLoading(true);
      setError("");

      try {
        // ==========================================
        // RETURNED FROM CHAPA
        // ==========================================

        if (paymentResult === "returned" && txRef) {
          console.log("🔥 RETURNED FROM CHAPA — STARTING VERIFICATION");

          setVerifying(true);

          let latestData = null;

          // Try up to 6 times.
          // 4 seconds between attempts.
          const maxAttempts = 6;
          const delayMs = 4000;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (cancelled) return;

            console.log(
              `🔥 CHAPA VERIFICATION ATTEMPT ${attempt}/${maxAttempts}`,
            );

            latestData = await verifyChapaPayment(txRef);

            if (cancelled) return;

            setPayment(latestData.data);

            // ==========================================
            // PAYMENT PAID
            // ==========================================

            if (latestData.data.paymentStatus === "paid") {
              console.log("✅ PAYMENT CONFIRMED AS PAID");

              setUploadMessage("Payment successfully verified.");

              // Only clean the URL after confirmed payment.
              window.history.replaceState({}, "", `/client/payments/${id}`);

              return;
            }

            // ==========================================
            // REVIEW REQUIRED
            // ==========================================

            if (latestData.data.paymentStatus === "review_required") {
              setUploadMessage("Payment requires additional verification.");

              return;
            }

            // ==========================================
            // STILL PENDING
            // ==========================================

            if (attempt < maxAttempts) {
              console.log("⏳ Chapa still pending. Waiting...");

              setUploadMessage(
                `Payment is being confirmed with Chapa... (${attempt}/${maxAttempts})`,
              );

              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }

          // ==========================================
          // POLLING FINISHED
          // ==========================================

          if (cancelled) return;

          setPayment(latestData?.data);

          setUploadMessage(
            "Your payment is still being confirmed by Chapa. Please check the status again shortly.",
          );

          // IMPORTANT:
          // Do NOT remove tx_ref here.
          //
          // It remains available if the user refreshes.
          return;
        }

        // ==========================================
        // NORMAL PAGE VISIT
        // ==========================================

        const data = await fetchPayment();

        if (cancelled || !data) return;

        setPayment(data);
      } catch (error) {
        if (cancelled) return;

        console.error("Payment loading error:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load payment.",
        );
      } finally {
        if (!cancelled) {
          setVerifying(false);
          setLoading(false);
        }
      }
    }

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, [id, paymentResult, txRef]);
  // ============================================================
  // FORMAT HELPERS
  // ============================================================

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString();
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function getStatusLabel(status) {
    switch (status) {
      case "pending":
        return "Pending";

      case "pending_verification":
        return "Pending Verification";

      case "paid":
        return "Paid";

      case "rejected":
        return "Rejected";

      case "review_required":
        return "Review Required";

      case "overdue":
        return "Overdue";

      default:
        return status;
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case "paid":
        return <FaCheckCircle />;

      case "overdue":
        return <FaExclamationTriangle />;

      case "pending_verification":
      case "review_required":
        return <FaClock />;

      default:
        return <FaMoneyBillWave />;
    }
  }

  // ============================================================
  // RECEIPT FILE
  // ============================================================

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    setUploadMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);

      setUploadMessage("Please upload a PDF, JPG, JPEG, or PNG file.");

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setSelectedFile(null);

      setUploadMessage("The receipt file must be smaller than 5 MB.");

      return;
    }

    setSelectedFile(file);
  }

  // ============================================================
  // UPLOAD RECEIPT
  // ============================================================

  async function handleReceiptUpload() {
    if (!selectedFile) {
      setUploadMessage("Please select a receipt first.");

      return;
    }

    try {
      setUploading(true);

      setUploadMessage("");

      const formData = new FormData();

      formData.append("receipt", selectedFile);

      const response = await fetch(`/api/client/payments/${id}/receipt`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to upload receipt.");
      }

      setPayment(data.data);

      setSelectedFile(null);

      setUploadMessage(
        "Receipt uploaded successfully. It is now waiting for manager verification.",
      );
    } catch (error) {
      console.error("Receipt upload error:", error);

      setUploadMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  // ============================================================
  // CHAPA PAYMENT
  // ============================================================
  async function handleChapaPayment() {
    try {
      setChapaLoading(true);
      setUploadMessage("");

      const response = await fetch(
        `/api/client/payments/${id}/chapa/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      console.log("Chapa initialize response:", data);

      if (!response.ok || !data.success) {
        let message = "Chapa payment could not be initialized.";

        if (typeof data.message === "string") {
          message = data.message;
        } else if (data.message && typeof data.message === "object") {
          message = Object.entries(data.message)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(", ")}`;
              }

              return `${field}: ${String(errors)}`;
            })
            .join(" | ");
        }

        throw new Error(message);
      }

      if (!data.checkoutUrl) {
        throw new Error("Chapa checkout URL was not returned.");
      }

      console.log("Transaction reference:", data.transactionReference);
      console.log("Redirecting to:", data.checkoutUrl);

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Chapa payment error:", error);

      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Chapa payment could not be initialized.",
      );
    } finally {
      setChapaLoading(false);
    }
  }

  // ============================================================
  // RECHECK CHAPA PAYMENT
  // ============================================================

  async function handleRecheckStatus() {
    if (!payment?.transactionReference) {
      setUploadMessage("Transaction reference is not available.");

      return;
    }

    try {
      setVerifying(true);
      setUploadMessage("");
      setError("");

      console.log("🔄 MANUAL CHAPA STATUS CHECK");

      const response = await fetch(
        `/api/client/payments/${id}/chapa/verify?tx_ref=${encodeURIComponent(
          payment.transactionReference,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      console.log("MANUAL CHAPA VERIFY RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to check payment status.");
      }

      setPayment(data.data);

      if (data.data.paymentStatus === "paid") {
        setUploadMessage("Payment successfully verified.");

        // Clean URL because payment is now final.
        window.history.replaceState({}, "", `/client/payments/${id}`);
      } else if (data.data.paymentStatus === "review_required") {
        setUploadMessage("Payment requires additional verification.");
      } else {
        setUploadMessage("Payment is still pending. Please try again shortly.");
      }
    } catch (error) {
      console.error("Manual payment verification error:", error);

      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Unable to check payment status.",
      );
    } finally {
      setVerifying(false);
    }
  }
  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="payment-details-page">
        <div className="payment-details-loading">
          {verifying ? "Verifying Chapa payment..." : "Loading payment..."}
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !payment) {
    return (
      <div className="payment-details-page">
        <div className="payment-details-error">
          <h2>Payment Not Found</h2>

          <p>{error || "Payment could not be found."}</p>

          <Link href="/client/payments">
            <FaArrowLeft />
            Back to Payments
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // STATUS
  // ============================================================

  const currency = payment.property?.currency || "ETB";

  const chapaLimit = 1000000;
  const chapaAmount = Number(payment.expectedAmount);

  const chapaAvailable =
    currency === "ETB" && chapaAmount > 0 && chapaAmount <= chapaLimit;

  const isPaid = payment.paymentStatus === "paid";

  const isPendingVerification =
    payment.paymentStatus === "pending_verification";

  const isReviewRequired = payment.paymentStatus === "review_required";

  const isRejected = payment.paymentStatus === "rejected";

  const isPayable =
    payment.paymentStatus === "pending" || payment.paymentStatus === "overdue";

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="payment-details-page">
      {/* Header */}

      <div className="payment-details-header">
        <Link href="/client/payments" className="payment-back-link">
          <FaArrowLeft />
          Back to Payments
        </Link>

        {/* RETURNED FROM CHAPA */}

        {paymentResult === "returned" && verifying && (
          <section className="payment-result-card success">
            <FaClock />

            <div>
              <h2>Verifying Payment</h2>

              <p>We are confirming your Chapa transaction.</p>

              <span>Transaction: {txRef || "-"}</span>
            </div>
          </section>
        )}

        {/* PAYMENT SUCCESS */}

        {paymentResult === "returned" && !verifying && isPaid && (
          <section className="payment-result-card success">
            <FaCheckCircle />

            <div>
              <h2>Payment Successful</h2>

              <p>Your payment has been successfully verified.</p>

              <span>
                Transaction: {payment.transactionReference || txRef || "-"}
              </span>
            </div>
          </section>
        )}

        {/* PAYMENT REVIEW */}

        {paymentResult === "returned" && !verifying && isReviewRequired && (
          <section className="payment-result-card review">
            <FaExclamationTriangle />

            <div>
              <h2>Payment Under Review</h2>

              <p>
                Chapa returned the transaction, but it requires additional
                verification.
              </p>

              {payment.verificationNotes && (
                <span>{payment.verificationNotes}</span>
              )}
            </div>
          </section>
        )}

        {/* HEADING */}

        <div className="payment-details-heading">
          <div>
            <span>PAYMENT DETAILS</span>

            <h1>Installment #{payment.installmentNumber}</h1>

            <p>{payment.property?.title || "Property Payment"}</p>
          </div>

          <div className={`payment-details-status ${payment.paymentStatus}`}>
            {getStatusIcon(payment.paymentStatus)}

            {getStatusLabel(payment.paymentStatus)}
          </div>
        </div>
      </div>

      {/* Payment overview */}

      <div className="payment-overview-grid">
        <div className="payment-overview-card">
          <FaFileInvoiceDollar />

          <span>Expected Amount</span>

          <strong>
            {formatAmount(payment.expectedAmount)} {currency}
          </strong>
        </div>

        <div className="payment-overview-card">
          <FaMoneyBillWave />

          <span>Paid Amount</span>

          <strong>
            {formatAmount(payment.paidAmount)} {currency}
          </strong>
        </div>

        <div className="payment-overview-card">
          <FaCalendarAlt />

          <span>Due Date</span>

          <strong>{formatDate(payment.dueDate)}</strong>
        </div>

        <div className="payment-overview-card">
          <FaFileInvoiceDollar />

          <span>Contract</span>

          <strong>{payment.contract?.contractNumber || "-"}</strong>
        </div>
      </div>

      {/* Payment information */}

      <section className="payment-information-card">
        <div className="payment-section-title">
          <h2>Payment Information</h2>
        </div>

        <div className="payment-information-grid">
          <div>
            <span>Property</span>

            <strong>{payment.property?.title || "-"}</strong>
          </div>

          <div>
            <span>Installment</span>

            <strong>#{payment.installmentNumber}</strong>
          </div>

          <div>
            <span>Due Date</span>

            <strong>{formatDate(payment.dueDate)}</strong>
          </div>

          <div>
            <span>Payment Method</span>

            <strong>
              {payment.paymentMethod === "chapa"
                ? "Chapa"
                : payment.paymentMethod === "receipt"
                  ? "Receipt"
                  : "Not selected"}
            </strong>
          </div>
        </div>
      </section>

      {/* Paid */}

      {isPaid && (
        <section className="payment-success-card">
          <FaCheckCircle />

          <div>
            <h2>Payment Completed</h2>

            <p>This installment has been successfully paid.</p>

            {payment.paymentDate && (
              <span>Paid on {formatDate(payment.paymentDate)}</span>
            )}
          </div>
        </section>
      )}

      {/* Pending verification */}

      {isPendingVerification && (
        <section className="payment-status-message verification">
          <FaClock />

          <div>
            <h2>Receipt Under Verification</h2>

            <p>
              Your receipt has been submitted successfully. The manager will
              review your payment.
            </p>
          </div>
        </section>
      )}

      {/* Review */}

      {isReviewRequired && (
        <section className="payment-status-message review">
          <FaExclamationTriangle />

          <div>
            <h2>Payment Requires Review</h2>

            <p>This payment requires additional verification.</p>

            {payment.verificationNotes && (
              <div className="verification-notes">
                <strong>Verification note:</strong>

                <p>{payment.verificationNotes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rejected */}

      {isRejected && (
        <section className="payment-status-message rejected">
          <FaExclamationTriangle />

          <div>
            <h2>Payment Rejected</h2>

            <p>
              Your previous payment was rejected. Please review the details and
              submit a new payment.
            </p>

            {payment.verificationNotes && (
              <div className="verification-notes">
                <strong>Verification note:</strong>

                <p>{payment.verificationNotes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Chapa verification message */}

      {paymentResult === "returned" && uploadMessage && (
        <div className="receipt-upload-message">{uploadMessage}</div>
      )}

      {/* Existing receipt */}

      {payment.receipt?.fileUrl && (
        <section className="payment-receipt-card">
          <div>
            <span>UPLOADED RECEIPT</span>

            <h2>{payment.receipt.fileName || "Payment Receipt"}</h2>

            {payment.receipt.uploadedAt && (
              <p>Uploaded {formatDate(payment.receipt.uploadedAt)}</p>
            )}
          </div>

          <a
            href={`/api/client/payments/${payment._id}/receipt/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="receipt-view-btn"
          >
            View Receipt
          </a>
        </section>
      )}

      {/* Payment methods */}

      {isPayable && (
        <section className="payment-method-section">
          <div className="payment-section-title">
            <span>MAKE PAYMENT</span>

            <h2>Choose a payment method</h2>

            <p>Select how you would like to pay this installment.</p>
          </div>

          <div className="payment-method-grid">
            {/* Chapa */}

            <div className="payment-method-card chapa">
              <div className="payment-method-icon">
                <FaCreditCard />
              </div>

              <div>
                <h3>Pay with Chapa</h3>

                <p>
                  Pay securely online. Successful payments can be verified
                  automatically.
                </p>
              </div>

              <button
                type="button"
                className="chapa-payment-btn"
                onClick={handleChapaPayment}
                disabled={chapaLoading || !chapaAvailable}
              >
                {chapaLoading
                  ? "Connecting to Chapa..."
                  : !chapaAvailable
                    ? "Chapa Unavailable"
                    : "Pay with Chapa"}
              </button>

              {!chapaAvailable && (
                <p className="receipt-upload-message">
                  Chapa supports transactions up to 1,000,000 ETB. Please use
                  the bank receipt option for this installment.
                </p>
              )}
            </div>

            {/* Bank receipt */}

            <div className="payment-method-card receipt">
              <div className="payment-method-icon">
                <FaUpload />
              </div>

              <div>
                <h3>Upload Bank Receipt</h3>

                <p>Upload your payment receipt for manager verification.</p>
              </div>

              <label className="receipt-file-input">
                <span>
                  {selectedFile ? selectedFile.name : "Choose Receipt"}
                </span>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  className="upload-receipt-btn"
                  onClick={handleReceiptUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Submit Receipt"}
                </button>
              )}

              {uploadMessage && paymentResult !== "returned" && (
                <p className="receipt-upload-message">{uploadMessage}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Notes */}

      {payment.notes && (
        <section className="payment-notes-card">
          <h2>Payment Notes</h2>

          <p>{payment.notes}</p>
        </section>
      )}
    </div>
  );
}
