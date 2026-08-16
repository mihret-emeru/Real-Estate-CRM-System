"use client";

import { useEffect, useState } from "react";
import PaymentActions from "@/components/payments/PaymentActions";
import paymentStatusLabel from "@/utils/paymentStatusLabel";
import "@/styles/payment-details.css";
import Link from "next/link";

export default function PaymentDetailsPage({ params }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPayment() {
      try {
        const { id } = await params;

        const response = await fetch(`/api/payments/${id}`);

        const result = await response.json();

        if (result.success) {
          setPayment(result.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, [params]);

  if (loading) {
    return <p>Loading payment...</p>;
  }

  if (!payment) {
    return <p>Payment not found.</p>;
  }

  async function updatePayment(status) {
    try {
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
          paidAmount: payment.expectedAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPayment(result.data);

        alert(`Payment ${status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="payment-details-page">
      <Link href="/manager/payments" className="back-link">
        ← Back to Payments
      </Link>

      <h1>Payment Details</h1>

      <div className="payment-details-card">
        <h2>Client Information</h2>

        <p>
          <strong>Name:</strong> {payment.client?.name}
        </p>

        <p>
          <strong>Email:</strong> {payment.client?.email}
        </p>
      </div>

      <div className="payment-details-card">
        <h2>Contract Information</h2>

        <p>
          <strong>Contract:</strong> {payment.contract?.contractNumber}
        </p>

        <p>
          <strong>Property:</strong> {payment.property?.title}
        </p>
      </div>

      <div className="payment-details-card">
        <h2>Installment Information</h2>

        <p>
          <strong>Installment:</strong> #{payment.installmentNumber}
        </p>

        <p>
          <strong>Due Date:</strong>{" "}
          {new Date(payment.dueDate).toLocaleDateString()}
        </p>

        <p>
          <strong>Expected Amount:</strong>{" "}
          {Number(payment.expectedAmount).toLocaleString()} ETB
        </p>

        <p>
          <strong>Paid Amount:</strong>{" "}
          {Number(payment.paidAmount).toLocaleString()} ETB
        </p>

        <p>
          <strong>Status:</strong> {paymentStatusLabel(payment.paymentStatus)}
        </p>

        {payment.verifiedAt && (
          <div className="verification-info">
            <p>
              <strong>Verified At:</strong>{" "}
              {new Date(payment.verifiedAt).toLocaleString()}
            </p>
          </div>
        )}

        {payment.verificationNotes && (
          <div className="verification-notes">
            <h3>Verification Notes</h3>

            <p>{payment.verificationNotes}</p>
          </div>
        )}

        {payment.receipt?.fileUrl && (
          <div className="receipt-section">
            <h2>Payment Receipt</h2>

            <p>{payment.receipt.fileName}</p>

            <a
              href={payment.receipt.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Receipt
            </a>
          </div>
        )}
      </div>

      <PaymentActions payment={payment} onUpdate={setPayment} />
    </div>
  );
}

