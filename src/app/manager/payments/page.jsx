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

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /*
   * Summary cards need all payments.
   *
   * We keep your existing summary-card behavior for now.
   */
  const [allPayments, setAllPayments] = useState([]);

  async function loadPayments(
    currentPage = 1,
    currentFilter = filter,
    currentSearch = search,
  ) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        status: currentFilter,
        search: currentSearch,
      });

      const response = await fetch(`/api/payments?${params.toString()}`);

      const result = await response.json();

      if (result.success) {
        setPayments(result.data || []);

        setPagination(
          result.pagination || {
            page: currentPage,
            limit: 10,
            total: 0,
            totalPages: 1,
          },
        );
      }
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments(1, filter, search);
  }, [filter, search]);

  /*
   * Load payment data for summary cards.
   *
   * This keeps the cards independent from the table pagination.
   */
  useEffect(() => {
    async function loadSummaryPayments() {
      try {
        const response = await fetch("/api/payments?limit=10000");

        const result = await response.json();

        if (result.success) {
          setAllPayments(result.data || []);
        }
      } catch (error) {
        console.error("Failed to load payment summary:", error);
      }
    }

    loadSummaryPayments();
  }, []);

  function handlePageChange(page) {
    loadPayments(page, filter, search);
  }

  if (loading && payments.length === 0) {
    return <p>Loading payments...</p>;
  }

  return (
    <div className="payments-page">
      <h1>Payments</h1>

      <PaymentSummaryCards payments={allPayments} />

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
              value: "partial",
              label: "Partial",
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
          onChange={(value) => {
            setFilter(value);
          }}
        />

        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
      </div>

      <PaymentTable
        payments={payments}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
