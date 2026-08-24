"use client";

import "@/styles/manager-needs-attention.css";

import { FaExclamationTriangle, FaArrowRight } from "react-icons/fa";

export default function ManagerNeedsAttention({ alerts = [] }) {
  if (!alerts.length) {
    return (
      <section className="manager-needs-attention">
        <div className="manager-needs-attention-header">
          <div>
            <h2>Needs Attention</h2>
            <p>Items that may require your attention.</p>
          </div>
        </div>

        <div className="manager-needs-attention-empty">
          <span>✓</span>
          <p>Everything looks good.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="manager-needs-attention">
      <div className="manager-needs-attention-header">
        <div>
          <h2>Needs Attention</h2>
          <p>Items that may require your attention.</p>
        </div>
      </div>

      <div className="manager-alert-list">
        {alerts.map((alert) => (
          <div className="manager-alert-item" key={alert.id}>
            <div className="manager-alert-icon">
              <FaExclamationTriangle />
            </div>

            <div className="manager-alert-content">
              <strong>{alert.title}</strong>

              <span>{alert.message}</span>
            </div>

            {alert.href && (
              <a href={alert.href} className="manager-alert-link">
                <span>View</span>
                <FaArrowRight />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
