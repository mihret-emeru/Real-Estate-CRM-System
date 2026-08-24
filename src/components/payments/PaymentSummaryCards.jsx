import "@/styles/payment-summary-cards.css";
import {
  FaMoneyBillWave,
  FaCheckCircle,
  FaWallet,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function PaymentSummaryCards({ payments }) {
  const totalExpected = payments.reduce(
    (sum, payment) => sum + Number(payment.expectedAmount || 0),
    0,
  );

  const totalCollected = payments
    .filter((payment) => payment.paymentStatus === "paid")
    .reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);

  const outstanding = payments
    .filter(
      (payment) =>
        payment.paymentStatus === "pending" ||
        payment.paymentStatus === "pending_verification" ||
        payment.paymentStatus === "overdue",
    )
    .reduce((sum, payment) => sum + Number(payment.expectedAmount || 0), 0);

  const overdue = payments
    .filter((payment) => payment.paymentStatus === "overdue")
    .reduce((sum, payment) => sum + Number(payment.expectedAmount || 0), 0);

  return (
    <div className="payment-summary">
      <div className="summary-card">
        <FaMoneyBillWave />
        <h3>Total Expected Revenue</h3>
        <p>{totalExpected.toLocaleString()} ETB</p>
      </div>

      <div className="summary-card">
        <FaCheckCircle />
        <h3>Collected Amount</h3>
        <p>{totalCollected.toLocaleString()} ETB</p>
      </div>

      <div className="summary-card">
        <FaWallet />
        <h3>Outstanding Balance</h3>
        <p>{outstanding.toLocaleString()} ETB</p>
      </div>

      <div className="summary-card">
        <FaExclamationTriangle />
        <h3>Overdue Amount</h3>
        <p>{overdue.toLocaleString()} ETB</p>
      </div>
    </div>
  );
}
