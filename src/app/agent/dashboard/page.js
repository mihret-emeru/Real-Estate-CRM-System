"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaComments,
  FaMoneyBillWave,
  FaArrowRight,
} from "react-icons/fa";

import "@/styles/agent/dashboard.css";

export default function AgentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/agent/dashboard", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load dashboard.");
      }

      setDashboard(data.data);
    } catch (error) {
      console.error("Agent dashboard error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  function formatCurrency(amount, currency = "ETB") {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="agent-dashboard-page">
        <div className="agent-dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-dashboard-page">
        <div className="agent-dashboard-error">
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>

          <button onClick={fetchDashboard}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const {
    agent,
    stats,
    properties,
    upcomingAppointments,
    commissionByProperty,
  } = dashboard;

  return (
    <div className="agent-dashboard-page">
      <div className="agent-dashboard-header">
        <div>
          <span className="agent-dashboard-eyebrow">Agent Workspace</span>

          <h1>Welcome back, {agent?.name || "Agent"}</h1>

          <p>Here's an overview of your current activity.</p>
        </div>
      </div>

      <div className="agent-dashboard-summary">
        <div className="agent-dashboard-summary-card">
          <div className="agent-dashboard-summary-icon">
            <FaHome />
          </div>

          <div>
            <span>Assigned Properties</span>
            <strong>{stats.assignedProperties}</strong>
          </div>
        </div>

        <div className="agent-dashboard-summary-card">
          <div className="agent-dashboard-summary-icon">
            <FaUser />
          </div>

          <div>
            <span>Active Leads</span>
            <strong>{stats.activeLeads}</strong>
          </div>
        </div>

        <div className="agent-dashboard-summary-card">
          <div className="agent-dashboard-summary-icon">
            <FaCalendarAlt />
          </div>

          <div>
            <span>Today's Appointments</span>
            <strong>{stats.todayAppointments}</strong>
          </div>
        </div>

        <div className="agent-dashboard-summary-card">
          <div className="agent-dashboard-summary-icon">
            <FaComments />
          </div>

          <div>
            <span>Unread Messages</span>
            <strong>{stats.unreadMessages}</strong>
          </div>
        </div>

        <div className="agent-dashboard-summary-card agent-dashboard-commission-card">
          <div className="agent-dashboard-summary-icon">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Total Commission</span>
            <strong>{formatCurrency(stats.totalCommission)}</strong>
          </div>
        </div>
      </div>

      <div className="agent-dashboard-main-grid">
        <section className="agent-dashboard-section">
          <div className="agent-dashboard-section-header">
            <div>
              <span>Portfolio</span>
              <h2>Assigned Properties</h2>
            </div>

            <Link href="/agent/properties">
              View All
              <FaArrowRight />
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="agent-dashboard-empty">
              <p>No properties assigned yet.</p>
            </div>
          ) : (
            <div className="agent-dashboard-property-grid">
              {properties.map((property) => (
                <Link
                  key={property._id}
                  href={`/agent/properties/${property._id}`}
                  className="agent-dashboard-property-card"
                >
                  <div className="agent-dashboard-property-image">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt={property.title} />
                    ) : (
                      <FaHome />
                    )}
                  </div>

                  <div className="agent-dashboard-property-info">
                    <h3>{property.title}</h3>

                    <p>{property.location?.city || "Location unavailable"}</p>

                    <strong>
                      {formatCurrency(property.price, property.currency)}
                    </strong>

                    <span
                      className={`agent-dashboard-property-status ${property.status}`}
                    >
                      {property.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="agent-dashboard-section">
          <div className="agent-dashboard-section-header">
            <div>
              <span>Schedule</span>
              <h2>Upcoming Appointments</h2>
            </div>

            <Link href="/agent/appointments">
              View All
              <FaArrowRight />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="agent-dashboard-empty">
              <p>No upcoming appointments.</p>
            </div>
          ) : (
            <div className="agent-dashboard-appointment-list">
              {upcomingAppointments.map((appointment) => {
                const date =
                  appointment.scheduledDate || appointment.requestedDate;

                return (
                  <Link
                    key={appointment._id}
                    href="/agent/appointments"
                    className="agent-dashboard-appointment"
                  >
                    <div className="agent-dashboard-appointment-date">
                      <FaCalendarAlt />

                      <span>{formatDate(date)}</span>
                    </div>

                    <div className="agent-dashboard-appointment-info">
                      <strong>{appointment.client?.name || "Client"}</strong>

                      <span>{appointment.property?.title || "Property"}</span>
                    </div>

                    <span
                      className={`agent-dashboard-appointment-status ${appointment.status}`}
                    >
                      {appointment.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="agent-dashboard-section agent-dashboard-commission-section">
        <div className="agent-dashboard-section-header">
          <div>
            <span>Earnings</span>
            <h2>Commission by Property</h2>
          </div>
        </div>

        {commissionByProperty.length === 0 ? (
          <div className="agent-dashboard-empty">
            <FaMoneyBillWave />

            <p>No commission earned yet.</p>

            <span>
              Commission is calculated at 2% of sold properties assigned to you.
            </span>
          </div>
        ) : (
          <div className="agent-dashboard-commission-list">
            {commissionByProperty.map((property) => (
              <div
                key={property._id}
                className="agent-dashboard-commission-row"
              >
                <div>
                  <strong>{property.title}</strong>

                  <span>
                    Sale price:{" "}
                    {formatCurrency(property.price, property.currency)}
                  </span>
                </div>

                <strong>
                  {formatCurrency(property.commission, property.currency)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
