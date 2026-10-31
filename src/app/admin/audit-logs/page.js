"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import "@/styles/admin/audit-logs.css";

import {
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaHistory,
  FaUser,
  FaShieldAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const limit = 20;

  async function fetchAuditLogs(currentPage = 1) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (moduleFilter !== "all") {
        params.append("module", moduleFilter);
      }

      if (actionFilter !== "all") {
        params.append("action", actionFilter);
      }

      const response = await fetch(
        `/api/admin/audit-logs?${params.toString()}`,
      );

      const data = await response.json();

      if (data.success) {
        setLogs(data.data || []);

        setPagination(
          data.pagination || {
            page: currentPage,
            limit,
            total: data.data?.length || 0,
            totalPages: 1,
          },
        );
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditLogs(page);
  }, [page, moduleFilter, actionFilter]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    setPage(1);
    fetchAuditLogs(1);
  }

  function clearSearch() {
    setSearch("");
    setPage(1);

    setTimeout(() => {
      fetchAuditLogs(1);
    }, 0);
  }

  function formatDate(date) {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatLabel(value) {
    if (!value) {
      return "-";
    }

    return value
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getActionClass(action) {
    if (
      [
        "deleted",
        "deactivated",
        "login_failed",
        "failed_login",
        "authentication_failed",
      ].includes(action)
    ) {
      return "danger";
    }

    if (["created", "activated"].includes(action)) {
      return "success";
    }

    if (action === "role_changed") {
      return "warning";
    }

    return "neutral";
  }

  function getUserName(log) {
    if (!log.user) {
      return "System";
    }

    if (typeof log.user === "string") {
      return log.user;
    }

    return log.user.name || log.user.email || "Unknown User";
  }

  function getUserRole(log) {
    if (!log.user || typeof log.user === "string") {
      return "";
    }

    return log.user.role || "";
  }

  const hasFilters =
    search.trim() || moduleFilter !== "all" || actionFilter !== "all";

  return (
    <div className="admin-audit-logs-page">
      <div className="admin-audit-logs-header">
        <div className="admin-audit-logs-heading">
          <Link href="/admin/dashboard" className="admin-audit-logs-back">
            <FaArrowLeft />
            <span>Dashboard</span>
          </Link>

          <div className="admin-audit-logs-title-row">
            <div>
              <div className="admin-audit-logs-eyebrow">
                Security & Activity
              </div>

              <h1>Audit Logs</h1>

              <p>
                Review system activity, administrative changes, and security
                events.
              </p>
            </div>

            <div className="admin-audit-logs-title-icon">
              <FaHistory />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-audit-logs-summary">
        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            <FaHistory />
          </div>

          <div>
            <span>Total Logs</span>
            <strong>{pagination.total.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            <FaShieldAlt />
          </div>

          <div>
            <span>Current Page</span>
            <strong>{pagination.totalPages === 0 ? 0 : pagination.page}</strong>
          </div>
        </div>

        <div className="admin-audit-logs-summary-card">
          <div className="admin-audit-logs-summary-icon">
            <FaUser />
          </div>

          <div>
            <span>Showing</span>
            <strong>{logs.length}</strong>
          </div>
        </div>
      </div>

      <div className="admin-audit-logs-card">
        <div className="admin-audit-logs-card-header">
          <div>
            <h2>System Activity</h2>

            <p>
              Complete record of important administrative and system actions.
            </p>
          </div>
        </div>

        <div className="admin-audit-logs-filters">
          <form
            className="admin-audit-logs-search"
            onSubmit={handleSearchSubmit}
          >
            <FaSearch />

            <input
              type="text"
              placeholder="Search audit logs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}

            <button type="submit">Search</button>
          </form>

          <div className="admin-audit-logs-filter">
            <FaFilter />

            <select
              value={moduleFilter}
              onChange={(event) => {
                setModuleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Modules</option>
              <option value="users">Users</option>
              <option value="authentication">Authentication</option>
              <option value="settings">Settings</option>
              <option value="system_configuration">System Configuration</option>
              <option value="properties">Properties</option>
              <option value="sales">Sales</option>
              <option value="payments">Payments</option>
            </select>
          </div>

          <div className="admin-audit-logs-filter">
            <select
              value={actionFilter}
              onChange={(event) => {
                setActionFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="activated">Activated</option>
              <option value="deactivated">Deactivated</option>
              <option value="role_changed">Role Changed</option>
              <option value="login_failed">Login Failed</option>
              <option value="authentication_failed">
                Authentication Failed
              </option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="admin-audit-logs-filter-status">
            <span>Filters applied</span>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setModuleFilter("all");
                setActionFilter("all");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="admin-audit-logs-loading">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="admin-audit-logs-empty">
            <div className="admin-audit-logs-empty-icon">
              <FaHistory />
            </div>

            <h3>No audit logs found</h3>

            <p>
              {hasFilters
                ? "No audit logs match the selected filters."
                : "There are no audit logs available yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-audit-logs-table-wrapper">
              <table className="admin-audit-logs-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                    <th>User</th>
                    <th>Target</th>
                    <th>Date & Time</th>
                    <th>IP Address</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <span
                          className={`admin-audit-logs-action ${getActionClass(
                            log.action,
                          )}`}
                        >
                          {formatLabel(log.action)}
                        </span>
                      </td>

                      <td>
                        <span className="admin-audit-logs-module">
                          {formatLabel(log.module)}
                        </span>
                      </td>

                      <td>
                        <div className="admin-audit-logs-description">
                          {log.description || "-"}
                        </div>
                      </td>

                      <td>
                        <div className="admin-audit-logs-user">
                          <strong>{getUserName(log)}</strong>

                          {getUserRole(log) && (
                            <span>{formatLabel(getUserRole(log))}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="admin-audit-logs-target">
                          {log.targetModel ? (
                            <>
                              <strong>{formatLabel(log.targetModel)}</strong>

                              {log.targetId && (
                                <span>{String(log.targetId).slice(-8)}</span>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>

                      <td>
                        <time>{formatDate(log.createdAt)}</time>
                      </td>

                      <td>
                        <span className="admin-audit-logs-ip">
                          {log.ipAddress || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-audit-logs-footer">
              <div className="admin-audit-logs-info">
                Showing{" "}
                {pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1}{" "}
                - {Math.min(pagination.page * limit, pagination.total)} of{" "}
                {pagination.total.toLocaleString()} logs
              </div>

              {pagination.totalPages > 1 && (
                <div className="admin-audit-logs-pagination">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <FaChevronLeft />
                    <span>Previous</span>
                  </button>

                  {Array.from(
                    {
                      length: pagination.totalPages,
                    },
                    (_, index) => index + 1,
                  )
                    .filter((pageNumber) => {
                      if (pagination.totalPages <= 7) {
                        return true;
                      }

                      return (
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        Math.abs(pageNumber - pagination.page) <= 1
                      );
                    })
                    .map((pageNumber, index, pages) => {
                      const previousPage = pages[index - 1];

                      const showEllipsis =
                        previousPage && pageNumber - previousPage > 1;

                      return (
                        <div
                          key={pageNumber}
                          className="admin-audit-logs-page-group"
                        >
                          {showEllipsis && (
                            <span className="admin-audit-logs-ellipsis">
                              ...
                            </span>
                          )}

                          <button
                            className={
                              pagination.page === pageNumber ? "active" : ""
                            }
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    <span>Next</span>
                    <FaChevronRight />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
