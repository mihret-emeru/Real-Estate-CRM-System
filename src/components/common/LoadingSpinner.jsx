"use client";

import "@/styles/loading-spinner.css";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />

      <p className="loading-spinner-message">{message}</p>
    </div>
  );
}
