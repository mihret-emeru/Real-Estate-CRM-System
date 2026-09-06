"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import ReportChart from "@/components/reports/ReportChart";

import "@/styles/admin/reports.css";

import {
  FaChartBar,
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaUserFriends,
  FaMoneyBillWave,
  FaSyncAlt,
  FaFileExport,
  FaPrint,
} from "react-icons/fa";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({
    totalProperties: 0,
    totalLeads: 0,
    totalClients: 0,
    totalAgents: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  const [salesData, setSalesData] = useState({});
  const [leadData, setLeadData] = useState({});
  const [propertyData, setPropertyData] = useState({});
  const [agentData, setAgentData] = useState({});

  const [reports, setReports] = useState([]);

  const [filters, setFilters] = useState({
    reportType: "all",
    dateRange: "all",
  });

  const [reportPage, setReportPage] = useState(1);

  const reportLimit = 10;

  async function fetchReports(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (filters.reportType !== "all") {
        params.set("reportType", filters.reportType);
      }

      if (filters.dateRange !== "all") {
        params.set("dateRange", filters.dateRange);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/admin/reports${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load reports.");
      }

      setOverview({
        totalProperties: data.data?.overview?.totalProperties || 0,
        totalLeads: data.data?.overview?.totalLeads || 0,
        totalClients: data.data?.overview?.totalClients || 0,
        totalAgents: data.data?.overview?.totalAgents || 0,
        totalSales: data.data?.overview?.totalSales || 0,
        totalRevenue: data.data?.overview?.totalRevenue || 0,
      });

      setSalesData(data.data?.sales || {});
      setLeadData(data.data?.leads || {});
      setPropertyData(data.data?.properties || {});
      setAgentData(data.data?.agents || {});
      setReports(data.data?.reports || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);

      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    setReportPage(1);
    fetchReports();
  }, [filters]);

  function handleFilterChange(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleRefresh() {
    fetchReports(true);
  }

  function handleExport() {
    window.print();
  }

  function handlePrint() {
    window.print();
  }

  function formatReportDate(date) {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatReportValue(value) {
    const numericValue = Number(value || 0);

    return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatLabel(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getCategoryClass(category) {
    return `admin-report-category admin-report-category-${String(
      category || "other",
    ).toLowerCase()}`;
  }

  const totalReportPages = Math.max(1, Math.ceil(reports.length / reportLimit));

  const reportStartIndex = (reportPage - 1) * reportLimit;

  const reportEndIndex = reportStartIndex + reportLimit;

  const paginatedReports = reports.slice(reportStartIndex, reportEndIndex);

  const displayedStart = reports.length === 0 ? 0 : reportStartIndex + 1;

  const displayedEnd = Math.min(reportEndIndex, reports.length);

  function handleReportPageChange(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalReportPages) {
      return;
    }

    setReportPage(pageNumber);
  }

  function getPageNumbers() {
    if (totalReportPages <= 5) {
      return Array.from({ length: totalReportPages }, (_, index) => index + 1);
    }

    if (reportPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (reportPage >= totalReportPages - 2) {
      return [
        totalReportPages - 4,
        totalReportPages - 3,
        totalReportPages - 2,
        totalReportPages - 1,
        totalReportPages,
      ];
    }

    return [
      reportPage - 2,
      reportPage - 1,
      reportPage,
      reportPage + 1,
      reportPage + 2,
    ];
  }

  const salesChartData = {
    labels: Object.keys(salesData.status || {}).map(formatLabel),
    datasets: [
      {
        label: "Sales",
        data: Object.values(salesData.status || {}).map((value) =>
          Number(value || 0),
        ),
      },
    ],
  };

  const leadChartData = {
    labels: Object.keys(leadData.status || {}).map(formatLabel),
    datasets: [
      {
        label: "Leads",
        data: Object.values(leadData.status || {}).map((value) =>
          Number(value || 0),
        ),
      },
    ],
  };

  const propertyChartData = {
    labels: Object.keys(propertyData.status || {}).map(formatLabel),
    datasets: [
      {
        label: "Properties",
        data: Object.values(propertyData.status || {}).map((value) =>
          Number(value || 0),
        ),
      },
    ],
  };

  const agentChartData = {
    labels: Array.isArray(agentData.performance)
      ? agentData.performance.map((agent) => agent.name || "Agent")
      : [],
    datasets: [
      {
        label: "Revenue",
        data: Array.isArray(agentData.performance)
          ? agentData.performance.map((agent) => Number(agent.revenue || 0))
          : [],
      },
    ],
  };

  if (loading) {
    return (
      <div className="admin-reports-loading">
        <div className="admin-reports-loading-spinner"></div>

        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports-page">
      <div className="admin-reports-header">
        <div className="admin-reports-heading">
          <div className="admin-reports-heading-content">
            <div className="admin-reports-eyebrow">Analytics & Insights</div>

            <h1>Reports</h1>

            <p>
              Monitor overall CRM performance, sales, properties, leads, and
              agent activity.
            </p>
          </div>

          <FaChartBar className="admin-reports-title-icon" />
        </div>

        <div className="admin-reports-actions">
          <button
            type="button"
            className="admin-reports-action-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSyncAlt className={refreshing ? "admin-reports-spin" : ""} />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="admin-reports-action-btn"
            onClick={handleExport}
          >
            <FaFileExport />

            <span>Export</span>
          </button>

          <button
            type="button"
            className="admin-reports-action-btn"
            onClick={handlePrint}
          >
            <FaPrint />

            <span>Print</span>
          </button>
        </div>
      </div>

      {error && <div className="admin-reports-alert">{error}</div>}

      <div className="admin-reports-filters">
        <div className="admin-reports-filter-group">
          <label>Report Type</label>

          <CustomDropdown
            value={filters.reportType}
            onChange={(value) => handleFilterChange("reportType", value)}
            options={[
              {
                value: "all",
                label: "All Reports",
              },
              {
                value: "sales",
                label: "Sales",
              },
              {
                value: "properties",
                label: "Properties",
              },
              {
                value: "leads",
                label: "Leads",
              },
              {
                value: "agents",
                label: "Agents",
              },
              {
                value: "financial",
                label: "Financial",
              },
            ]}
          />
        </div>

        <div className="admin-reports-filter-group">
          <label>Date Range</label>

          <CustomDropdown
            value={filters.dateRange}
            onChange={(value) => handleFilterChange("dateRange", value)}
            options={[
              {
                value: "all",
                label: "All Time",
              },
              {
                value: "today",
                label: "Today",
              },
              {
                value: "week",
                label: "This Week",
              },
              {
                value: "month",
                label: "This Month",
              },
              {
                value: "year",
                label: "This Year",
              },
            ]}
          />
        </div>
      </div>

      <section className="admin-reports-section">
        <div className="admin-reports-section-header">
          <div>
            <h2>Overview</h2>

            <p>Summary of the entire real estate CRM.</p>
          </div>
        </div>

        <div className="admin-reports-overview">
          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaBuilding />
            </div>

            <div>
              <span>Total Properties</span>

              <strong>{overview.totalProperties.toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaUserFriends />
            </div>

            <div>
              <span>Total Leads</span>

              <strong>{overview.totalLeads.toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaUsers />
            </div>

            <div>
              <span>Total Clients</span>

              <strong>{overview.totalClients.toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaUserTie />
            </div>

            <div>
              <span>Total Agents</span>

              <strong>{overview.totalAgents.toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaChartBar />
            </div>

            <div>
              <span>Total Sales</span>

              <strong>{overview.totalSales.toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-report-card">
            <div className="admin-report-card-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <span>Total Revenue</span>

              <strong>{formatReportValue(overview.totalRevenue)} ETB</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-reports-section">
        <div className="admin-reports-section-header">
          <div>
            <h2>Performance Charts</h2>

            <p>Visual overview of CRM performance and activity.</p>
          </div>
        </div>

        <div className="admin-reports-charts">
          <div className="admin-reports-chart-card">
            <div className="admin-reports-chart-header">
              <div>
                <h3>Sales Performance</h3>

                <p>Sales grouped by contract status.</p>
              </div>
            </div>

            <div className="admin-reports-chart">
              {salesChartData.labels.length > 0 ? (
                <ReportChart type="bar" data={salesChartData} />
              ) : (
                <div className="admin-reports-empty">
                  No sales data available.
                </div>
              )}
            </div>
          </div>

          <div className="admin-reports-chart-card">
            <div className="admin-reports-chart-header">
              <div>
                <h3>Lead Performance</h3>

                <p>Leads grouped by status.</p>
              </div>
            </div>

            <div className="admin-reports-chart">
              {leadChartData.labels.length > 0 ? (
                <ReportChart type="doughnut" data={leadChartData} />
              ) : (
                <div className="admin-reports-empty">
                  No lead data available.
                </div>
              )}
            </div>
          </div>

          <div className="admin-reports-chart-card">
            <div className="admin-reports-chart-header">
              <div>
                <h3>Property Performance</h3>

                <p>Properties grouped by status.</p>
              </div>
            </div>

            <div className="admin-reports-chart">
              {propertyChartData.labels.length > 0 ? (
                <ReportChart type="doughnut" data={propertyChartData} />
              ) : (
                <div className="admin-reports-empty">
                  No property data available.
                </div>
              )}
            </div>
          </div>

          <div className="admin-reports-chart-card">
            <div className="admin-reports-chart-header">
              <div>
                <h3>Agent Performance</h3>

                <p>Revenue generated by assigned agents.</p>
              </div>
            </div>

            <div className="admin-reports-chart">
              {agentChartData.labels.length > 0 ? (
                <ReportChart type="bar" data={agentChartData} />
              ) : (
                <div className="admin-reports-empty">
                  No agent performance data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-reports-section">
        <div className="admin-reports-section-header">
          <div>
            <h2>Reports Table</h2>

            <p>Summary of report records generated from CRM activity.</p>
          </div>
        </div>

        <div className="admin-reports-table-wrapper">
          {reports.length === 0 ? (
            <div className="admin-reports-empty">
              No report records available.
            </div>
          ) : (
            <>
              <div className="admin-reports-table-responsive">
                <table className="admin-reports-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Report</th>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Value</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedReports.map((report, index) => (
                      <tr
                        key={
                          report._id ||
                          report.id ||
                          `${report.date}-${report.report}-${index}`
                        }
                      >
                        <td>
                          <span className="admin-report-date">
                            {formatReportDate(report.date)}
                          </span>
                        </td>

                        <td>
                          <div className="admin-report-name">
                            {report.report || "-"}
                          </div>
                        </td>

                        <td>
                          <span className={getCategoryClass(report.category)}>
                            {formatLabel(report.category || "other")}
                          </span>
                        </td>

                        <td>
                          <span className="admin-report-count">
                            {Number(report.count || 0).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          <span className="admin-report-value">
                            {Number(report.value || 0) > 0
                              ? `${formatReportValue(report.value)} ${
                                  report.currency || "ETB"
                                }`
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalReportPages > 1 && (
                <div className="admin-reports-pagination">
                  <button
                    type="button"
                    className="admin-reports-pagination-btn"
                    disabled={reportPage === 1}
                    onClick={() => handleReportPageChange(reportPage - 1)}
                  >
                    Previous
                  </button>

                  <div className="admin-reports-pagination-pages">
                    {getPageNumbers().map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={`admin-reports-pagination-page ${
                          reportPage === pageNumber ? "active" : ""
                        }`}
                        onClick={() => handleReportPageChange(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="admin-reports-pagination-btn"
                    disabled={reportPage === totalReportPages}
                    onClick={() => handleReportPageChange(reportPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="admin-reports-pagination-info">
                Showing {displayedStart}–{displayedEnd} of {reports.length}{" "}
                reports
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

