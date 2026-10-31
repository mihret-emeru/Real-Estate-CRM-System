"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FaCreditCard,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaArrowRight,
} from "react-icons/fa";

export default function ClientPaymentOverview() {
  const [summary, setSummary] = useState(null);
  const [nextPayment, setNextPayment] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaymentOverview() {
      try {
        setLoading(true);

        const response = await fetch("/api/client/payments", {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load payment overview.");
        }

        setSummary(data.summary || null);
        setNextPayment(data.nextPayment || null);
      } catch (error) {
        console.error("Failed to load payment overview:", error);

        setSummary(null);
        setNextPayment(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentOverview();
  }, []);

  function formatAmount(amount, currency = "ETB") {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  }

  function formatDueDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  }

  const currency = nextPayment?.property?.currency || "ETB";

  return (
    <section className="client-payment-overview">
      <div className="client-payment-overview-header">
        <div>
          <span>FINANCIAL OVERVIEW</span>

          <h2>Payment Overview</h2>
        </div>

        <FaCreditCard className="client-payment-header-icon" />
      </div>

      {loading ? (
        <div className="client-payment-overview-loading">
          Loading payment information...
        </div>
      ) : (
        <div className="client-payment-summary">
          {/* Next Payment */}

          <div className="client-payment-item">
            <div className="client-payment-item-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <span>Next Payment</span>

              <strong>
                {nextPayment
                  ? formatAmount(nextPayment.expectedAmount, currency)
                  : "No payment due"}
              </strong>
            </div>
          </div>

          {/* Due Date */}

          <div className="client-payment-item">
            <div className="client-payment-item-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <span>Due Date</span>

              <strong>
                {nextPayment ? formatDueDate(nextPayment.dueDate) : "-"}
              </strong>
            </div>
          </div>

          {/* Outstanding */}

          <div className="client-payment-item outstanding">
            <div className="client-payment-item-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <span>Outstanding</span>

              <strong>
                {summary
                  ? formatAmount(summary.outstandingBalance, currency)
                  : "0 ETB"}
              </strong>
            </div>
          </div>

          {/* View Payments */}

          <Link href="/client/payments" className="client-view-payments-btn">
            View Payments
            <FaArrowRight />
          </Link>
        </div>
      )}
    </section>
  );
}
