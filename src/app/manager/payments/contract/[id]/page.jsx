"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";
import "@/styles/payment-details.css";

export default function ContractPaymentsPage({ params }) {
  const [contractId, setContractId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setContractId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  useEffect(() => {
    if (!contractId) return;

    async function loadPayments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/payments/contract/${contractId}`);

        const result = await response.json();

        if (!result.success) {
          setError(result.message || "Failed to load payments.");
          return;
        }

        setPayments(result.data || []);
      } catch (error) {
        console.error("Failed to load contract payments:", error);

        setError("Failed to load contract payments.");
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [contractId]);

  if (loading) {
    return (
      <div className="payment-details-page">
        <p>Loading payment schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-details-page">
        <Link href="/manager/payments" className="back-link">
          ← Back to Payments
        </Link>

        <p>{error}</p>
      </div>
    );
  }

  const firstPayment = payments[0];

  const clientName =
    firstPayment?.client?.name || firstPayment?.lead?.fullName || "-";

  const propertyName = firstPayment?.property?.title || "-";

  const contractNumber = firstPayment?.contract?.contractNumber || "-";

  const totalExpected = payments.reduce(
    (total, payment) => total + Number(payment.expectedAmount || 0),
    0,
  );

  const totalPaid = payments.reduce(
    (total, payment) => total + Number(payment.paidAmount || 0),
    0,
  );

  const outstanding = totalExpected - totalPaid;

  return (
    <div className="payment-details-page">
      {/* Header */}
      <Link href="/manager/payments" className="back-link">
        ← Back to Payments
      </Link>

      <h1>Payment Schedule</h1>

      <div className="payment-details-card">
        <h2>Contract Information</h2>

        <p>
          <strong>Contract:</strong> {contractNumber}
        </p>

        <p>
          <strong>Client:</strong> {clientName}
        </p>

        <p>
          <strong>Property:</strong> {propertyName}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="payment-details-card">
        <h2>Payment Summary</h2>

        <p>
          <strong>Total Expected:</strong> {totalExpected.toLocaleString()} ETB
        </p>

        <p>
          <strong>Paid:</strong> {totalPaid.toLocaleString()} ETB
        </p>

        <p>
          <strong>Outstanding:</strong> {outstanding.toLocaleString()} ETB
        </p>

        <p>
          <strong>Installments:</strong> {payments.length}
        </p>
      </div>

      {/* Installments */}
      <div className="payment-details-card">
        <h2>Installments</h2>

        <div className="payment-table-container">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Installment</th>
                <th>Due Date</th>
                <th>Expected</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7">No installments found.</td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const expected = Number(payment.expectedAmount || 0);

                  const paid = Number(payment.paidAmount || 0);

                  const remaining = expected - paid;

                  return (
                    <tr key={payment._id}>
                      <td>#{payment.installmentNumber}</td>

                      <td>
                        {payment.dueDate
                          ? new Date(payment.dueDate).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>{expected.toLocaleString()} ETB</td>

                      <td>{paid.toLocaleString()} ETB</td>

                      <td>{remaining.toLocaleString()} ETB</td>

                      <td>
                        <PaymentStatusBadge status={payment.paymentStatus} />
                      </td>

                      <td>
                        <Link href={`/manager/payments/${payment._id}`}>
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
