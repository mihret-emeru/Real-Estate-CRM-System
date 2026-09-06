"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ReportChart from "@/components/reports/ReportChart";

import "@/styles/admin/dashboard.css";

import {
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaUserFriends,
  FaUserClock,
  FaMoneyBillWave,
  FaArrowRight,
  FaClipboardList,
  FaHistory,
  FaCog,
  FaExclamationCircle,
  FaShieldAlt,
  FaUserEdit,
  FaCogs,
  FaUserSlash,
} from "react-icons/fa";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalLeads: 0,
    totalClients: 0,
    totalAgents: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  const [salesChartData, setSalesChartData] = useState(null);
  const [leadChartData, setLeadChartData] = useState(null);

  const [activities, setActivities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);

  async function fetchDashboard() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load dashboard data.");
      }

      setOverview(
        data.data?.overview || {
          totalUsers: 0,
          totalProperties: 0,
          totalLeads: 0,
          totalClients: 0,
          totalAgents: 0,
          totalSales: 0,
          totalRevenue: 0,
        },
      );

      setSalesChartData(data.data?.sales || null);
      setLeadChartData(data.data?.leads || null);

      setActivities(data.data?.activities || []);
      setAuditLogs(data.data?.auditLogs || []);
      setAlerts(data.data?.alerts || []);
    } catch (error) {
      console.error("Failed to fetch admin dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatLabel(value) {
    if (!value) return "-";

    return value
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getActivityIcon(type) {
    if (type === "property") {
      return <FaBuilding />;
    }

    if (type === "user") {
      return <FaUsers />;
    }

    if (type === "lead") {
      return <FaUserClock />;
    }

    if (type === "sale") {
      return <FaMoneyBillWave />;
    }

    return <FaClipboardList />;
  }

  function getAlertIcon(type) {
    if (type === "security") {
      return <FaShieldAlt />;
    }

    if (type === "configuration") {
      return <FaCogs />;
    }

    if (type === "users") {
      return <FaUserEdit />;
    }

    return <FaExclamationCircle />;
  }

  if (loading) {
    return <div className="admin-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <div className="admin-dashboard-heading">
          <div className="admin-dashboard-heading-content">
            <div className="admin-dashboard-eyebrow">Admin Overview</div>

            <h1>Dashboard</h1>

            <p>
              Monitor overall CRM performance, users, properties, leads, sales,
              and system activity.
            </p>
          </div>

          <FaUsers className="admin-dashboard-title-icon" />
        </div>
      </div>

      <section className="admin-dashboard-stat-grid">
        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaUsers />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Users</span>
            <strong>{overview.totalUsers.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaBuilding />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Properties</span>
            <strong>{overview.totalProperties.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaUserClock />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Leads</span>
            <strong>{overview.totalLeads.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaUserFriends />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Clients</span>
            <strong>{overview.totalClients.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaUserTie />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Agents</span>
            <strong>{overview.totalAgents.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-dashboard-stat-icon">
            <FaMoneyBillWave />
          </div>

          <div className="admin-dashboard-stat-content">
            <span>Total Revenue</span>
            <strong>{formatCurrency(overview.totalRevenue)} ETB</strong>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-chart-grid">
        <div className="admin-dashboard-card admin-dashboard-chart-card">
          <div className="admin-dashboard-card-header">
            <div>
              <h2>Sales Performance</h2>
              <p>Overview of sales activity and revenue.</p>
            </div>

            <Link href="/admin/reports">
              View Reports
              <FaArrowRight />
            </Link>
          </div>

          <div className="admin-dashboard-chart">
            {salesChartData ? (
              <ReportChart type="bar" data={salesChartData} />
            ) : (
              <div className="admin-dashboard-empty">
                No sales data available.
              </div>
            )}
          </div>
        </div>

        <div className="admin-dashboard-card admin-dashboard-chart-card">
          <div className="admin-dashboard-card-header">
            <div>
              <h2>Lead Performance</h2>
              <p>Current lead distribution across the CRM.</p>
            </div>

            <Link href="/admin/reports">
              View Reports
              <FaArrowRight />
            </Link>
          </div>

          <div className="admin-dashboard-chart">
            {leadChartData ? (
              <ReportChart type="doughnut" data={leadChartData} />
            ) : (
              <div className="admin-dashboard-empty">
                No lead data available.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-card admin-dashboard-alerts-card">
        <div className="admin-dashboard-card-header">
          <div>
            <h2>Alerts & Attention</h2>
            <p>Important system and administrative items.</p>
          </div>

          <Link href="/admin/audit-logs">
            View All
            <FaArrowRight />
          </Link>
        </div>

        <div className="admin-dashboard-alert-list">
          {alerts.length === 0 ? (
            <div className="admin-dashboard-alert-empty">
              <div className="admin-dashboard-alert-empty-icon">
                <FaShieldAlt />
              </div>

              <div>
                <strong>No administrative alerts</strong>
                <span>
                  Everything looks good. There are no items requiring your
                  attention.
                </span>
              </div>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <Link
                href={alert.href || "/admin/audit-logs"}
                className={`admin-dashboard-alert-item ${alert.priority}`}
                key={`${alert.type}-${index}`}
              >
                <div className="admin-dashboard-alert-icon">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="admin-dashboard-alert-content">
                  <strong>{alert.title || "-"}</strong>

                  <span>{alert.description || "-"}</span>
                </div>

                <FaArrowRight className="admin-dashboard-alert-arrow" />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="admin-dashboard-content-grid">
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest activity across the CRM.</p>
            </div>

            <FaHistory />
          </div>

          <div className="admin-dashboard-activity-list">
            {activities.length === 0 ? (
              <div className="admin-dashboard-empty">No recent activity.</div>
            ) : (
              activities.map((activity, index) => (
                <div
                  className="admin-dashboard-activity-item"
                  key={activity._id || index}
                >
                  <div className="admin-dashboard-activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="admin-dashboard-activity-content">
                    <strong>{activity.title || "-"}</strong>

                    <span>{activity.description || "-"}</span>
                  </div>

                  <time>{formatDate(activity.date)}</time>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <div>
              <h2>Recent Audit Logs</h2>
              <p>Latest administrative and system actions.</p>
            </div>

            <Link href="/admin/audit-logs">
              View All
              <FaArrowRight />
            </Link>
          </div>

          <div className="admin-dashboard-audit-list">
            {auditLogs.length === 0 ? (
              <div className="admin-dashboard-empty">
                No audit logs available.
              </div>
            ) : (
              auditLogs.map((log, index) => {
                const targetName =
                  log.metadata?.targetName || log.targetName || null;

                const actorName = log.user?.name || log.userName || "System";

                let auditTitle = formatLabel(log.action);

                if (log.action === "updated" && log.module === "users") {
                  auditTitle = "Updated user account";
                }

                if (log.action === "deactivated" && log.module === "users") {
                  auditTitle = "Deactivated user account";
                }

                if (log.action === "activated" && log.module === "users") {
                  auditTitle = "Activated user account";
                }

                if (log.action === "created" && log.module === "users") {
                  auditTitle = "Created user account";
                }

                if (log.action === "deleted" && log.module === "users") {
                  auditTitle = "Deleted user account";
                }

                if (log.action === "role_changed" && log.module === "users") {
                  auditTitle = "Changed user role";
                }

                return (
                  <div
                    className="admin-dashboard-audit-item"
                    key={log._id || index}
                  >
                    <div className="admin-dashboard-audit-main">
                      <strong>{auditTitle}</strong>

                      <span>{targetName || "User account"}</span>

                      <small>By {actorName}</small>
                    </div>

                    <div className="admin-dashboard-audit-meta">
                      <span>{formatLabel(log.module)}</span>

                      <time>{formatDate(log.createdAt)}</time>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="admin-dashboard-bottom-actions">
        <Link href="/admin/users">
          <FaUsers />
          <span>User Management</span>
          <FaArrowRight />
        </Link>

        <Link href="/admin/settings">
          <FaCog />
          <span>System Configuration</span>
          <FaArrowRight />
        </Link>

        <Link href="/admin/audit-logs">
          <FaHistory />
          <span>Audit Logs</span>
          <FaArrowRight />
        </Link>
      </section>
    </div>
  );
}
