"use client";

import { useEffect, useState } from "react";

import "@/styles/manager-dashboard.css";

import AnalyticsKpiCards from "@/components/analytics/AnalyticsKpiCards";
import AnalyticsChart from "@/components/analytics/AnalyticsChart";
import ManagerNeedsAttention from "@/components/manager-dashboard/ManagerNeedsAttention";

export default function ManagerDashboardPage() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard");

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard.");
      }

      setDashboard(result.data);
    } catch (error) {
      console.error("Manager dashboard error:", error);

      setError(error.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="manager-dashboard-loading">Loading dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="manager-dashboard-error">
        <p>{error}</p>

        <button onClick={fetchDashboard}>Try Again</button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="manager-dashboard-empty">
        No dashboard data available.
      </div>
    );
  }

  /*
   * Convert API lead status data into Chart.js format.
   */
  const leadOverview = {
    labels: ["New", "Contacted", "Qualified", "Negotiation", "Won", "Lost"],

    datasets: [
      {
        label: "Leads",

        data: [
          dashboard.leads.statusCounts.new || 0,
          dashboard.leads.statusCounts.contacted || 0,
          dashboard.leads.statusCounts.qualified || 0,
          dashboard.leads.statusCounts.negotiation || 0,
          dashboard.leads.statusCounts.won || 0,
          dashboard.leads.statusCounts.lost || 0,
        ],
      },
    ],
  };

  /*
   * Property status chart.
   */
  const propertyStatus = {
    labels: ["Available", "Reserved", "Sold", "Rented", "Pending"],

    datasets: [
      {
        label: "Properties",

        data: [
          dashboard.properties.statusCounts.available || 0,
          dashboard.properties.statusCounts.reserved || 0,
          dashboard.properties.statusCounts.sold || 0,
          dashboard.properties.statusCounts.rented || 0,
          dashboard.properties.statusCounts.pending || 0,
        ],
      },
    ],
  };

  /*
   * Payment status chart.
   */
  const paymentOverview = {
    labels: [
      "Pending",
      "Pending Verification",
      "Paid",
      "Rejected",
      "Review Required",
      "Overdue",
    ],

    datasets: [
      {
        label: "Payments",

        data: [
          dashboard.payments.statusCounts.pending || 0,
          dashboard.payments.statusCounts.pending_verification || 0,
          dashboard.payments.statusCounts.paid || 0,
          dashboard.payments.statusCounts.rejected || 0,
          dashboard.payments.statusCounts.review_required || 0,
          dashboard.payments.statusCounts.overdue || 0,
        ],
      },
    ],
  };

  /*
   * Sales overview chart.
   */
  const salesOverview = {
    labels: dashboard.sales.overTime.labels,

    datasets: [
      {
        label: "Sales",

        data: dashboard.sales.overTime.values,
      },
    ],
  };

  const attentionAlerts = [];

  if (dashboard.needsAttention.overduePayments > 0) {
    attentionAlerts.push({
      id: "overdue-payments",
      title: "Overdue payments",
      message: `${dashboard.needsAttention.overduePayments} payment${
        dashboard.needsAttention.overduePayments === 1 ? "" : "s"
      } overdue.`,
      href: "/manager/payments",
    });
  }

  if (dashboard.needsAttention.pendingVerification > 0) {
    attentionAlerts.push({
      id: "pending-verification",
      title: "Payments awaiting verification",
      message: `${dashboard.needsAttention.pendingVerification} payment${
        dashboard.needsAttention.pendingVerification === 1 ? "" : "s"
      } waiting for verification.`,
      href: "/manager/payments",
    });
  }

  if (dashboard.needsAttention.uncontactedLeads > 0) {
    attentionAlerts.push({
      id: "uncontacted-leads",
      title: "New leads",
      message: `${dashboard.needsAttention.uncontactedLeads} new lead${
        dashboard.needsAttention.uncontactedLeads === 1 ? "" : "s"
      } need attention.`,
      href: "/manager/leads",
    });
  }

  if (dashboard.needsAttention.pendingContracts > 0) {
    attentionAlerts.push({
      id: "pending-contracts",
      title: "Pending contracts",
      message: `${dashboard.needsAttention.pendingContracts} contract${
        dashboard.needsAttention.pendingContracts === 1 ? "" : "s"
      } require attention.`,
      href: "/manager/contracts",
    });
  }

  return (
    <div className="manager-dashboard">
      {/* Header */}

      <div className="manager-dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>Welcome back. Here's what's happening with your business today.</p>
        </div>
      </div>

      {/* KPI Cards */}

      <section className="manager-dashboard-kpis">
        <AnalyticsKpiCards cards={dashboard.kpis} />
      </section>

      {/* Charts */}

      <section className="manager-dashboard-chart-grid">
        <AnalyticsChart
          type="line"
          title="Sales Overview"
          data={salesOverview}
        />

        <AnalyticsChart
          type="doughnut"
          title="Lead Status Distribution"
          data={leadOverview}
        />

        <AnalyticsChart
          type="doughnut"
          title="Property Status"
          data={propertyStatus}
        />

        <AnalyticsChart
          type="doughnut"
          title="Payment Status Distribution"
          data={paymentOverview}
        />
      </section>

      {/* Business Performance */}

      <section className="manager-dashboard-performance">
        <AnalyticsChart
          type="line"
          title="Business Performance"
          data={salesOverview}
        />
      </section>

      {/* Needs Attention */}

      <section className="manager-dashboard-attention">
        <ManagerNeedsAttention alerts={attentionAlerts} />
      </section>
    </div>
  );
}
