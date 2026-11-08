"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";
import {
  FaFileContract,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

import "@/styles/agent/contract-requests.css";

export default function AgentContractRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/agent/contract-requests/my");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load contract requests.",
          );
        }

        setRequests(result.data || []);
      } catch (error) {
        console.error("Fetch contract requests error:", error);
        setError(error.message || "Failed to load contract requests.");
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, []);

  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "approved",
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "rejected",
  ).length;

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  }

  function formatPrice(amount, currency = "ETB") {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  }

  if (loading) {
    return (
      <div className="agent-contract-requests-page">
        <LoadingSpinner message="Loading contract requests..." />
      </div>
    );
  }

  return (
    <div className="agent-contract-requests-page">
      <div className="agent-contract-requests-top">
        <BackLink href="/agent/leads" label="Back to Leads" />
      </div>

      <div className="agent-contract-requests-header">
        <div>
          <span>AGENT WORKSPACE</span>
          <h1>My Contract Requests</h1>
          <p>Track the contract requests you have submitted to managers.</p>
        </div>
      </div>

      {error && (
        <div className="agent-contract-requests-error">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="agent-contract-request-stats">
            <div className="agent-contract-stat-card">
              <div className="agent-contract-stat-icon">
                <FaFileContract />
              </div>
              <div>
                <span>Total Requests</span>
                <strong>{requests.length}</strong>
              </div>
            </div>

            <div className="agent-contract-stat-card">
              <div className="agent-contract-stat-icon pending">
                <FaClock />
              </div>
              <div>
                <span>Pending</span>
                <strong>{pendingCount}</strong>
              </div>
            </div>

            <div className="agent-contract-stat-card">
              <div className="agent-contract-stat-icon approved">
                <FaCheckCircle />
              </div>
              <div>
                <span>Approved</span>
                <strong>{approvedCount}</strong>
              </div>
            </div>

            <div className="agent-contract-stat-card">
              <div className="agent-contract-stat-icon rejected">
                <FaTimesCircle />
              </div>
              <div>
                <span>Rejected</span>
                <strong>{rejectedCount}</strong>
              </div>
            </div>
          </div>

          <section className="agent-contract-requests-table-card">
            <div className="agent-contract-requests-table-header">
              <div>
                <span>REQUEST HISTORY</span>
                <h2>Submitted Requests</h2>
              </div>
              <span>{requests.length} requests</span>
            </div>

            {requests.length === 0 ? (
              <div className="agent-contract-requests-empty">
                <FaFileContract />
                <h3>No Contract Requests Yet</h3>
                <p>
                  Contract requests you submit from lead details will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="agent-contract-requests-table-wrapper">
                <table className="agent-contract-requests-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Property</th>
                      <th>Property Price</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Manager</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td>
                          <strong>
                            {request.lead?.fullName || "Lead unavailable"}
                          </strong>
                          <small>{request.lead?.email || "-"}</small>
                        </td>

                        <td>
                          <strong>
                            {request.property?.title || "Property unavailable"}
                          </strong>
                          <small>{request.property?.propertyType || "-"}</small>
                        </td>

                        <td>
                          {formatPrice(request.propertyPrice, request.currency)}
                        </td>

                        <td>{formatDate(request.createdAt)}</td>

                        <td>
                          <span
                            className={`agent-contract-request-status ${request.status}`}
                          >
                            {request.status.replace("_", " ")}
                          </span>
                        </td>

                        <td>{request.reviewedBy?.name || "Awaiting review"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
