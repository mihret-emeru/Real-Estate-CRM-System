"use client";
import "@/styles/analytics-empty.css";

export default function AnalyticsEmptyState({
  title = "No Analytics Available",
  message = "There is no data available for the selected period.",
}) {
  return (
    <div className="analytics-empty-state">
      <div className="analytics-empty-icon">📊</div>

      <h2>{title}</h2>

      <p>{message}</p>
    </div>
  );
}
