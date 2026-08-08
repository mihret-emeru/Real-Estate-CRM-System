export default function ReportEmptyState({
  title = "No Report Generated",
  message = "Select a report type and date range, then generate a report.",
}) {
  return (
    <div className="report-empty-state">
      <div className="report-empty-icon">📊</div>

      <h2>{title}</h2>

      <p>{message}</p>
    </div>
  );
}

