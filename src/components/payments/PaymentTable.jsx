"use client";

import Link from "next/link";
import PaymentStatusBadge from "./PaymentStatusBadge";
import "@/styles/payment-table.css";

export default function PaymentTable({
  payments = [],
  pagination,
  onPageChange,
}) {
  return (
    <div className="payment-table-wrapper">
      <div className="payment-table-container">
        <table className="payment-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Property</th>
              <th>Installments</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.contractId}>
                  <td>
                    {payment.client?.name || payment.lead?.fullName || "-"}
                  </td>

                  <td>{payment.property?.title || "-"}</td>

                  <td>
                    {payment.paidInstallments} / {payment.totalInstallments}
                  </td>

                  <td>
                    {Number(payment.paidAmount || 0).toLocaleString()} ETB
                  </td>

                  <td>
                    {Number(payment.outstandingAmount || 0).toLocaleString()}{" "}
                    ETB
                  </td>

                  <td>
                    <PaymentStatusBadge status={payment.paymentStatus} />
                  </td>

                  <td>
                    <Link
                      href={`/manager/payments/contract/${payment.contractId}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="payment-pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </button>

          {Array.from(
            { length: pagination.totalPages },
            (_, index) => index + 1,
          ).map((pageNumber) => (
            <button
              key={pageNumber}
              className={pagination.page === pageNumber ? "active" : ""}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {pagination && (
        <div className="payment-pagination-info">
          Showing{" "}
          {pagination.total === 0
            ? 0
            : (pagination.page - 1) * pagination.limit + 1}{" "}
          - {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} contracts
        </div>
      )}
    </div>
  );
}
