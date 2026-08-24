import "@/styles/report-summary-cards.css";
export default function ReportSummaryCards({ summary = [] }) {
  return (
    <div className="report-summary-cards">
      {summary.map((item, index) => (
        <div className="report-summary-card" key={item.id || index}>
          <div className="report-summary-card-content">
            <p>{item.label}</p>
            <h3>{item.value}</h3>

            {item.description && <span>{item.description}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
