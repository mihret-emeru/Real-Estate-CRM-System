"use client";

import { useEffect, useState } from "react";
import "@/styles/reports.css";

import ReportHeader from "@/components/reports/ReportHeader";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportSummaryCards from "@/components/reports/ReportSummaryCards";
import ReportTable from "@/components/reports/ReportTable";
import ReportChart from "@/components/reports/ReportChart";
import ReportActions from "@/components/reports/ReportActions";
import ReportEmptyState from "@/components/reports/ReportEmptyState";
import ReportOverview from "@/components/reports/ReportOverview";

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportPeriod, setReportPeriod] = useState("daily");

  useEffect(() => {
    handleGenerateReport({
      reportType: "overview",
      reportPeriod: "daily",
      startDate: "",
      endDate: "",
    });
  }, []);

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
  async function handleGenerateReport(filters) {
    try {
      setLoading(true);
      setShowReport(false);

      let startDate = filters.startDate;
      let endDate = filters.endDate;

      if (filters.reportPeriod === "daily") {
        const today = new Date();

        startDate = formatLocalDate(today);
        endDate = startDate;
      }

      if (filters.reportPeriod === "monthly") {
        const today = new Date();

        startDate = formatLocalDate(
          new Date(today.getFullYear(), today.getMonth(), 1),
        );

        endDate = formatLocalDate(
          new Date(today.getFullYear(), today.getMonth() + 1, 0),
        );
      }

      if (filters.reportPeriod === "yearly") {
        const today = new Date();

        startDate = formatLocalDate(new Date(today.getFullYear(), 0, 1));

        endDate = formatLocalDate(new Date(today.getFullYear(), 11, 31));
      }

      const params = new URLSearchParams({
        type: filters.reportType,
        startDate,
        endDate,
      });

      const response = await fetch(`/api/reports?${params}`);

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Failed to generate report.");
        return;
      }

      setReport({
        reportType: result.data.reportType,
        reportPeriod: filters.reportPeriod,
        startDate,
        endDate,
        summary: result.data.summary || [],
        columns: result.data.columns || [],
        data: result.data.rows || [],
        chart: result.data.chart || null,
      });

      setShowReport(true);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPDF() {
    if (!report) {
      alert("Please generate a report first.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Real Estate CRM Report", 14, 20);

      doc.setFontSize(11);
      doc.text(`Report: ${report.reportType}`, 14, 30);

      doc.text(`Period: ${report.startDate} to ${report.endDate}`, 14, 37);

      let y = 50;

      report.summary?.forEach((item) => {
        doc.text(`${item.label}: ${item.value}`, 14, y);

        y += 8;
      });

      y += 5;

      report.data?.forEach((row) => {
        const values = report.columns
          .map((column) => {
            const value = row[column.key];

            if (value === null || value === undefined) {
              return "-";
            }

            if (typeof value === "object") {
              return value.name || value.title || value.email || "-";
            }

            return String(value);
          })
          .join(" | ");

        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(8);
        doc.text(values.substring(0, 110), 14, y);

        y += 6;
      });

      doc.save(`${report.reportType}-report.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF.");
    }
  }

  async function handleExportExcel() {
    if (!report) {
      alert("Please generate a report first.");
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const worksheetData = report.data.map((row) => {
        const formattedRow = {};

        report.columns.forEach((column) => {
          let value = row[column.key];

          if (value === null || value === undefined) {
            value = "-";
          }

          if (typeof value === "object") {
            value = value.name || value.title || value.email || "-";
          }

          formattedRow[column.label] = value;
        });

        return formattedRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

      XLSX.writeFile(workbook, `${report.reportType}-report.xlsx`);
    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Failed to export Excel.");
    }
  }

  function getReportDates(period) {
    const today = new Date();

    if (period === "daily") {
      return {
        startDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ),
        endDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        ),
      };
    }

    if (period === "monthly") {
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
    }

    if (period === "yearly") {
      return {
        startDate: new Date(today.getFullYear(), 0, 1),
        endDate: new Date(today.getFullYear(), 11, 31),
      };
    }

    return {
      startDate: null,
      endDate: null,
    };
  }

  return (
    <div className="reports-page">
      <ReportHeader />

      <section className="reports-configuration">
        <ReportFilters onGenerate={handleGenerateReport} />
      </section>

      {loading ? (
        <div className="report-loading">Generating report...</div>
      ) : !report ? (
        <ReportEmptyState />
      ) : (
        <>
          <ReportActions
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            hasReport={!!report}
          />

          {showReport && (
            <section className="generated-report">
              <div className="generated-report-header">
                {report.reportType !== "overview" && <h2>Generated Report</h2>}

                {report.reportType === "overview" && (
                  <ReportOverview
                    title={`${(report.reportPeriod || "daily")
                      .charAt(0)
                      .toUpperCase()}${(report.reportPeriod || "daily").slice(
                      1,
                    )} Overview`}
                    period={`${report.startDate} to ${report.endDate}`}
                    summary={report.summary}
                  />
                )}
              </div>

              {report.reportType !== "overview" && (
                <p className="report-date-range">
                  {report.startDate} — {report.endDate}
                </p>
              )}

              {report.reportType !== "overview" && (
                <ReportSummaryCards summary={report.summary} />
              )}

              {report.chart && (
                <ReportChart
                  type={report.chart.type}
                  data={report.chart.data}
                  title={report.chart.title}
                />
              )}

              {report.reportType !== "overview" && (
                <ReportTable
                  title="Report Details"
                  columns={report.columns}
                  data={report.data}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
