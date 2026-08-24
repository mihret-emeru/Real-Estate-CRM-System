"use client";

import { useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import "@/styles/report-filters.css";

export default function ReportFilters({ onGenerate }) {
  const [reportType, setReportType] = useState("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportPeriod, setReportPeriod] = useState("daily");

  function handleSubmit(e) {
    e.preventDefault();

    if (reportPeriod === "custom" && (!startDate || !endDate)) {
      alert("Please select a start date and end date.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    onGenerate({
      reportType,
      reportPeriod,
      startDate,
      endDate,
    });
  }

  return (
    <form className="report-filters" onSubmit={handleSubmit}>
      <div className="report-filter-group">
        <div className="report-filter-group">
          <label>Report Period</label>

          <div className="report-period-options">
            <button
              type="button"
              className={reportPeriod === "daily" ? "active" : ""}
              onClick={() => {
                setReportPeriod("daily");

                onGenerate({
                  reportType,
                  reportPeriod: "daily",
                  startDate: "",
                  endDate: "",
                });
              }}
            >
              Daily
            </button>

            <button
              type="button"
              className={reportPeriod === "monthly" ? "active" : ""}
              onClick={() => {
                setReportPeriod("monthly");

                onGenerate({
                  reportType,
                  reportPeriod: "monthly",
                  startDate: "",
                  endDate: "",
                });
              }}
            >
              Monthly
            </button>

            <button
              type="button"
              className={reportPeriod === "yearly" ? "active" : ""}
              onClick={() => {
                setReportPeriod("yearly");

                onGenerate({
                  reportType,
                  reportPeriod: "yearly",
                  startDate: "",
                  endDate: "",
                });
              }}
            >
              Yearly
            </button>

            <button
              type="button"
              className={reportPeriod === "custom" ? "active" : ""}
              onClick={() => setReportPeriod("custom")}
            >
              Custom
            </button>
          </div>
        </div>

        <div className="report-filter-group">
          <label>Report Type</label>

          <CustomDropdown
            value={reportType}
            onChange={(value) => {
              setReportType(value);

              if (reportPeriod !== "custom") {
                onGenerate({
                  reportType: value,
                  reportPeriod,
                  startDate: "",
                  endDate: "",
                });
              }
            }}
            options={[
              {
                value: "overview",
                label: "Overview",
              },
              {
                value: "sales",
                label: "Sales Report",
              },
              {
                value: "properties",
                label: "Property Report",
              },
              {
                value: "leads",
                label: "Lead Report",
              },
              {
                value: "payments",
                label: "Payment Report",
              },
              {
                value: "agent-performance",
                label: "Agent Performance Report",
              },
            ]}
          />
        </div>
      </div>

      {reportPeriod === "custom" && (
        <div className="report-filter-group">
          <label htmlFor="startDate">Start Date</label>

          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      )}

      {reportPeriod === "custom" && (
        <div className="report-filter-group">
          <label htmlFor="endDate">End Date</label>

          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      )}

      {reportPeriod === "custom" && (
        <button type="submit" className="generate-report-btn">
          Generate Report
        </button>
      )}
    </form>
  );
}
