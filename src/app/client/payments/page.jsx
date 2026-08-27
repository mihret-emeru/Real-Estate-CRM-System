"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaArrowRight,
} from "react-icons/fa";

import "@/styles/client/payments.css";

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    totalPayments: 0,
    paidPayments: 0,
    pendingPayments: 0,
    pendingVerificationPayments: 0,
    reviewRequiredPayments: 0,
  });

  const [nextPayment, setNextPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/client/payments");

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load payments.");
        }

        setPayments(data.data || []);

        setSummary(
          data.summary || {
            totalExpected: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            totalPayments: 0,
            paidPayments: 0,
            pendingPayments: 0,
            pendingVerificationPayments: 0,
            reviewRequiredPayments: 0,
          },
        );

        setNextPayment(data.nextPayment || null);
      } catch (error) {
        console.error("Failed to fetch client payments:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, []);

  function formatAmount(amount) {
    return Number(amount || 0).toLocaleString();
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
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

  if (loading) {
    return (
      <div className="client-payments-page">
        <div className="client-payments-loading">Loading payments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-payments-page">
        <div className="client-payments-error">
          <h2>Unable to Load Payments</h2>

          <p>{error}</p>

          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-payments-page">
      {/* Header */}

      <div className="client-payments-header">
        <div>
          <span className="client-payments-eyebrow">FINANCIAL OVERVIEW</span>

          <h1>Payments</h1>

          <p>Track your property payments and installment schedule.</p>
        </div>
      </div>

      {/* Summary */}

      <div className="payment-summary-grid">
        <div className="payment-summary-card">
          <div className="payment-summary-icon">
            <FaFileInvoiceDollar />
          </div>

          <div>
            <span>Total Expected</span>

            <strong>{formatAmount(summary.totalExpected)} ETB</strong>
          </div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon">
            <FaCheckCircle />
          </div>

          <div>
            <span>Total Paid</span>

            <strong>{formatAmount(summary.totalPaid)} ETB</strong>
          </div>
        </div>

        <div className="payment-summary-card outstanding">
          <div className="payment-summary-icon">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Outstanding Balance</span>

            <strong>{formatAmount(summary.outstandingBalance)} ETB</strong>
          </div>
        </div>

        <div className="payment-summary-card">
          <div className="payment-summary-icon">
            <FaClock />
          </div>

          <div>
            <span>Installments</span>

            <strong>
              {summary.paidPayments} / {summary.totalPayments}
            </strong>
          </div>
        </div>
      </div>

      {/* Next payment */}

      {nextPayment && (
        <section className="next-payment-card">
          <div className="next-payment-content">
            <span className="next-payment-label">NEXT PAYMENT</span>

            <h2>
              {formatAmount(nextPayment.expectedAmount)}{" "}
              {nextPayment.property?.currency || "ETB"}
            </h2>

            <p>
              Installment #{nextPayment.installmentNumber}
              {" · "}
              Due {formatDate(nextPayment.dueDate)}
            </p>

            <span
              className={`payment-status-badge ${nextPayment.paymentStatus}`}
            >
              {getStatusIcon(nextPayment.paymentStatus)}

              {getStatusLabel(nextPayment.paymentStatus)}
            </span>
          </div>

          {(nextPayment.paymentStatus === "pending" ||
            nextPayment.paymentStatus === "overdue") && (
            <Link
              href={`/client/payments/${nextPayment._id}`}
              className="next-payment-btn"
            >
              Make Payment
              <FaArrowRight />
            </Link>
          )}
        </section>
      )}

      {/* Payments */}

      <section className="payments-section">
        <div className="payments-section-header">
          <div>
            <h2>Payment Schedule</h2>

            <p>View your installment history and upcoming payments.</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="payments-empty">
            <FaMoneyBillWave />

            <h3>No Payments Yet</h3>

            <p>
              Your payment installments will appear here once they are created.
            </p>
          </div>
        ) : (
          <div className="payment-list">
            {payments.map((payment) => {
              const isPayable =
                payment.paymentStatus === "pending" ||
                payment.paymentStatus === "overdue";

              return (
                <div className="payment-card" key={payment._id}>
                  <div className="payment-card-main">
                    <div className="payment-installment">
                      <span>INSTALLMENT</span>

                      <strong>#{payment.installmentNumber}</strong>
                    </div>

                    <div className="payment-property">
                      <span>Property</span>

                      <strong>{payment.property?.title || "-"}</strong>
                    </div>

                    <div className="payment-due-date">
                      <span>Due Date</span>

                      <strong>{formatDate(payment.dueDate)}</strong>
                    </div>

                    <div className="payment-amount">
                      <span>Amount</span>

                      <strong>
                        {formatAmount(payment.expectedAmount)}{" "}
                        {payment.property?.currency || "ETB"}
                      </strong>
                    </div>

                    <div className={`payment-status ${payment.paymentStatus}`}>
                      {getStatusIcon(payment.paymentStatus)}

                      <span>{getStatusLabel(payment.paymentStatus)}</span>
                    </div>

                    <div className="payment-card-actions">
                      <Link
                        href={`/client/payments/${payment._id}`}
                        className="payment-view-btn"
                      >
                        View
                      </Link>

                      {isPayable && (
                        <Link
                          href={`/client/payments/${payment._id}`}
                          className="payment-pay-btn"
                        >
                          Pay Now
                        </Link>
                      )}
                    </div>
                  </div>

                  {payment.paymentStatus === "pending_verification" && (
                    <div className="payment-info-message">
                      Your receipt has been submitted and is waiting for manager
                      verification.
                    </div>
                  )}

                  {payment.paymentStatus === "review_required" && (
                    <div className="payment-info-message review">
                      This payment requires additional verification by the
                      manager.
                    </div>
                  )}

                  {payment.paymentStatus === "rejected" && (
                    <div className="payment-info-message rejected">
                      This payment was rejected. Please review the payment
                      details and submit a new payment.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
