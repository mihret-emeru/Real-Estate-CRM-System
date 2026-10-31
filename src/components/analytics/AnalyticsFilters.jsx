"use client";

import { useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import "@/styles/analytics-filters.css";

export default function AnalyticsFilters({ onFilterChange }) {
  const [period, setPeriod] = useState("30-days");
  const [comparison, setComparison] = useState("previous");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handlePeriodChange(value) {
    setPeriod(value);

    if (value !== "custom") {
      onFilterChange({
        period: value,
        comparison,
        startDate: "",
        endDate: "",
      });
    }
  }

  function handleComparisonChange(value) {
    setComparison(value);

    if (period !== "custom") {
      onFilterChange({
        period,
        comparison: value,
        startDate: "",
        endDate: "",
      });
    }
  }

  function handleCustomSubmit(e) {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert("Please select a start date and end date.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    onFilterChange({
      period: "custom",
      comparison,
      startDate,
      endDate,
    });
  }

  return (
    <section className="analytics-filters">
      <div className="analytics-filter-group">
        <label>Period</label>

        <CustomDropdown
          value={period}
          onChange={handlePeriodChange}
          options={[
            {
              value: "today",
              label: "Today",
            },
            {
              value: "7-days",
              label: "7 Days",
            },
            {
              value: "30-days",
              label: "30 Days",
            },
            {
              value: "12-months",
              label: "12 Months",
            },
            {
              value: "custom",
              label: "Custom",
            },
          ]}
        />
      </div>

      <div className="analytics-filter-group">
        <label>Compare With</label>

        <CustomDropdown
          value={comparison}
          onChange={handleComparisonChange}
          options={[
            {
              value: "previous",
              label: "Previous Period",
            },
            {
              value: "none",
              label: "No Comparison",
            },
          ]}
        />
      </div>

      {period === "custom" && (
        <form
          className="analytics-custom-date-form"
          onSubmit={handleCustomSubmit}
        >
          <div className="analytics-filter-group">
            <label htmlFor="analytics-start-date">Start Date</label>

            <input
              id="analytics-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="analytics-filter-group">
            <label htmlFor="analytics-end-date">End Date</label>

            <input
              id="analytics-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="analytics-apply-btn">
            Apply
          </button>
        </form>
      )}
    </section>
  );
}
