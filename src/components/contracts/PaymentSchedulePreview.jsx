"use client";
import "@/styles/payment-schedule-preview.css";

export default function PaymentSchedulePreview({ schedule }) {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="payment-preview">
      <h3>Installment Schedule</h3>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {schedule.map((payment) => (
            <tr key={payment.installmentNumber}>
              <td>{payment.installmentNumber}</td>

              <td>{new Date(payment.dueDate).toLocaleDateString()}</td>

              <td>{Number(payment.amount).toLocaleString()} ETB</td>

              <td>
                <span className="pending-badge">{payment.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
