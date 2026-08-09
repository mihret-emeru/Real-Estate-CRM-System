"use client";

export default function AnalyticsSection({
  title = "",
  children,
  className = "",
}) {
  return (
    <section className={`analytics-section ${className}`.trim()}>
      {title && (
        <div className="analytics-section-header">
          <h2>{title}</h2>
        </div>
      )}

      <div className="analytics-section-content">{children}</div>
    </section>
  );
}

