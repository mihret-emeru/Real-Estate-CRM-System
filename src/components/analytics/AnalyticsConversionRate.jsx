"use client";

import "@/styles/analytics-conversion.css";

export default function AnalyticsConversionRate({ rate = 0 }) {
  return (
    <div className="analytics-conversion-card">
      <div className="analytics-conversion-header">
        <span>Lead → Won Conversion Rate</span>
      </div>

      <div className="analytics-conversion-value">{rate}%</div>

      <p>
        Percentage of leads that became won customers during the selected
        period.
      </p>
    </div>
  );
}

