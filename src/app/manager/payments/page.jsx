"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import PaymentSummaryCards from "@/components/payments/PaymentSummaryCards";
import PaymentTable from "@/components/payments/PaymentTable";
import "@/styles/payments.css";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPayments() {
      try {
        const response = await fetch("/api/payments");

        const result = await response.json();

        if (result.success) {
          setPayments(result.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  if (loading) {
    return <p>Loading payments...</p>;
  }

  const filteredPayments = payments.filter((payment) => {
    const statusMatch = filter === "all" || payment.paymentStatus === filter;

    const searchMatch = payment.client?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div className="payments-page">
      <h1>Payments</h1>
      <PaymentSummaryCards payments={payments} />

      <div className="payment-filters">
        <CustomDropdown
          value={filter}
          placeholder="Filter Payments"
          options={[
            {
              value: "all",
              label: "All Payments",
            },
            {
              value: "pending",
              label: "Pending",
            },
            {
              value: "pending_verification",
              label: "Pending Verification",
            },
            {
              value: "paid",
              label: "Paid",
            },
            {
              value: "rejected",
              label: "Rejected",
            },
            {
              value: "overdue",
              label: "Overdue",
            },
          ]}
          onChange={(value) => setFilter(value)}
        />

        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <PaymentTable payments={filteredPayments} />
    </div>
  );
}

