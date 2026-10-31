export default function LeadStatusBadge({ status }) {
  return <span className={`lead-status-badge ${status}`}>{status}</span>;
}
