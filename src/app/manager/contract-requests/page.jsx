"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";

import {
  FaFileContract,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

import "@/styles/contract-requests.css";

export default function ManagerContractRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/contracts/requests");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load contract requests.",
          );
        }

        setRequests(result.data || []);
      } catch (error) {
        console.error("Manager contract requests error:", error);
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
    return <LoadingSpinner message="Loading contract requests..." />;
  }

  return (
    <div className="manager-contract-requests-page">
      <div className="manager-contract-requests-top">
        <BackLink href="/manager/contracts" label="Back to Contracts" />
      </div>

      <div className="manager-contract-requests-header">
        <div>
          <span>MANAGER WORKSPACE</span>
          <h1>Contract Requests</h1>
          <p>Review and manage contract requests submitted by your agents.</p>
        </div>
      </div>

      {error && (
        <div className="manager-contract-requests-error">
          <p>{error}</p>

          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="manager-contract-request-stats">
            <div className="manager-contract-stat-card">
              <FaFileContract />
              <div>
                <span>Total Requests</span>
                <strong>{requests.length}</strong>
              </div>
            </div>

            <div className="manager-contract-stat-card">
              <FaClock />
              <div>
                <span>Pending</span>
                <strong>{pendingCount}</strong>
              </div>
            </div>

            <div className="manager-contract-stat-card">
              <FaCheckCircle />
              <div>
                <span>Approved</span>
                <strong>{approvedCount}</strong>
              </div>
            </div>

            <div className="manager-contract-stat-card">
              <FaTimesCircle />
              <div>
                <span>Rejected</span>
                <strong>{rejectedCount}</strong>
              </div>
            </div>
          </div>

          <section className="manager-contract-requests-table-card">
            <div className="manager-contract-requests-table-header">
              <div>
                <span>REQUEST MANAGEMENT</span>
                <h2>Submitted Requests</h2>
              </div>

              <span>{requests.length} requests</span>
            </div>

            {requests.length === 0 ? (
              <div className="manager-contract-requests-empty">
                <FaFileContract />
                <h3>No Contract Requests Yet</h3>
                <p>Agent contract requests will appear here when submitted.</p>
              </div>
            ) : (
              <div className="manager-contract-requests-table-wrapper">
                <table className="manager-contract-requests-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Lead</th>
                      <th>Property</th>
                      <th>Property Price</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td>
                          <strong>
                            {request.agent?.fullName ||
                              request.agent?.name ||
                              "Agent unavailable"}
                          </strong>
                          <small>{request.agent?.email || "-"}</small>
                        </td>

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
                            className={`manager-contract-request-status ${request.status}`}
                          >
                            {request.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/manager/contract-requests/${request._id}`}
                            className="manager-contract-request-view-button"
                          >
                            View Details
                          </Link>
                        </td>
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
