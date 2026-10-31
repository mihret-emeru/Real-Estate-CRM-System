"use client";
import "@/styles/payment-schedule-table.css";

export default function PaymentScheduleTable({ schedule }) {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <div className="payment-schedule">
      <h2>Installment Schedule</h2>

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

              <td>{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
