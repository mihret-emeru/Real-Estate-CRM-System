import "@/styles/payment-status-badge.css";

export default function PaymentStatusBadge({ status }) {
  const label = status.replace("_", " ");

  return <span className={`payment-status ${status}`}>{label}</span>;
}
