"use client";

import { useState } from "react";
import PaymentApprovalModal from "./PaymentApprovalModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import "@/styles/payment-actions.css";

export default function PaymentActions({ payment, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [action, setAction] = useState("");

  function openApprove() {
    setAction("approve");
    setShowModal(true);
  }

  function openReject() {
    setAction("reject");
    setShowModal(true);
  }

  async function updatePayment(status, notes) {
    try {
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          status,
          paidAmount: payment.expectedAmount,
          verificationNotes: notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onUpdate(result.data);

        alert(`Payment ${status} successfully.`);
      }
    } catch (error) {
      console.error(error);

      alert("Payment update failed.");
    }
  }

  return (
    <>
      <div className="payment-actions">
        {payment.paymentStatus !== "paid" && (
          <button className="payment-approve-btn" onClick={openApprove}>
            Approve Payment
          </button>
        )}

        {payment.paymentStatus !== "rejected" && (
          <button className="payment-reject-btn" onClick={openReject}>
            Reject Payment
          </button>
        )}
      </div>

      {showModal && (
        <ConfirmationModal
          title={action === "approve" ? "Approve Payment" : "Reject Payment"}
          message={`Client: ${payment.client?.name}`}
          confirmText={action === "approve" ? "Approve" : "Reject"}
          confirmClass={action === "approve" ? "approve-btn" : "reject-btn"}
          onCancel={() => {
            setShowModal(false);
            setVerificationNotes("");
          }}
          onConfirm={() => {
            if (action === "reject" && verificationNotes.trim() === "") {
              alert("Verification notes are required.");

              return;
            }

            updatePayment(
              action === "approve" ? "paid" : "rejected",
              verificationNotes,
            );

            setVerificationNotes("");

            setShowModal(false);
          }}
        >
          <p>
            <strong>Expected:</strong>{" "}
            {Number(payment.expectedAmount).toLocaleString()} ETB
          </p>

          <p>
            <strong>Paid:</strong>{" "}
            {Number(payment.paidAmount || 0).toLocaleString()} ETB
          </p>

          <label>Verification Notes</label>

          <textarea
            rows={4}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />
        </ConfirmationModal>
      )}
    </>
  );
}
