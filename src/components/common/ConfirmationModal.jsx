"use client";

import "@/styles/ConfirmationModal.css";

export default function ConfirmationModal({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmClass = "confirm-btn",
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <h2>{title}</h2>

        <p>{message}</p>

        {children}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>

          <button className={confirmClass} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

