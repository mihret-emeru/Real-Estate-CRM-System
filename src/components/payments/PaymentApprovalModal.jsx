"use client";

import { useState } from "react";

export default function PaymentApprovalModal({
  payment,
  action,
  onConfirm,
  onCancel,
}) {
  const [notes, setNotes] = useState("");

  const isApprove = action === "approve";

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <h2>{isApprove ? "Approve Payment" : "Reject Payment"}</h2>

        <p>
          <strong>Client:</strong> {payment.client?.name}
        </p>

        <p>
          <strong>Installment:</strong> #{payment.installmentNumber}
        </p>

        <p>
          <strong>Expected Amount:</strong>{" "}
          {Number(payment.expectedAmount).toLocaleString()} ETB
        </p>

        <p>
          <strong>Paid Amount:</strong>{" "}
          {Number(payment.paidAmount || 0).toLocaleString()} ETB
        </p>

        <label>Verification Notes</label>

        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your verification notes..."
        />

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>

          <button
            className={isApprove ? "approve-btn" : "reject-btn"}
            onClick={() => {
              if (!isApprove && notes.trim() === "") {
                alert(
                  "Verification notes are required when rejecting a payment.",
                );

                return;
              }

              onConfirm(notes);
            }}
          >
            {isApprove ? "Approve" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

