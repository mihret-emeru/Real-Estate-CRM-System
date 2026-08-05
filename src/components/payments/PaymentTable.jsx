import Link from "next/link";
import PaymentStatusBadge from "./PaymentStatusBadge";

export default function PaymentTable({ payments }) {
  return (
    <table className="payment-table">
      <thead>
        <tr>
          <th>Client</th>
          <th>Contract</th>
          <th>Installment</th>
          <th>Due Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {payments.length === 0 ? (
          <tr>
            <td colSpan="7">No payments found.</td>
          </tr>
        ) : (
          payments.map((payment) => (
            <tr key={payment._id}>
              <td>{payment.client?.name}</td>

              <td>{payment.contract?.contractNumber}</td>

              <td>#{payment.installmentNumber}</td>

              <td>{new Date(payment.dueDate).toLocaleDateString()}</td>

              <td>{Number(payment.expectedAmount).toLocaleString()} ETB</td>

              <td>
                <PaymentStatusBadge status={payment.paymentStatus} />
              </td>

              <td>
                <Link href={`/manager/payments/${payment._id}`}>View</Link>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

