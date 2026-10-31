"use client";

import "@/styles/analytics-chart.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);
import { chartColors } from "@/utils/chartColors";

export default function AnalyticsChart({
  type = "line",
  title = "",
  data = {},
  options = {},
  color = "leads",
}) {
  function getChartData() {
    if (!data?.datasets) {
      return data;
    }

    const selectedColor = chartColors[color] || chartColors.leads;

    return {
      ...data,

      labels: formatChartLabels(data.labels),

      datasets: data.datasets.map((dataset) => {
        // Doughnut and Pie
        if (type === "doughnut" || type === "pie") {
          return {
            ...dataset,

            backgroundColor: chartColors.palette,

            borderColor: "#ffffff",

            borderWidth: 2,
          };
        }

        // Line and Bar
        return {
          ...dataset,

          backgroundColor: selectedColor,

          borderColor: selectedColor,

          pointBackgroundColor: selectedColor,

          pointBorderColor: "#ffffff",

          pointBorderWidth: 2,

          borderWidth: type === "line" ? 2 : 1,

          barThickness: type === "bar" ? 28 : undefined,

          maxBarThickness: type === "bar" ? 32 : undefined,

          tension: type === "line" ? 0.35 : undefined,
        };
      }),
    };
  }
  function formatChartLabels(labels) {
    if (!Array.isArray(labels)) {
      return labels;
    }

    return labels.map((label) => {
      if (typeof label !== "string") {
        return label;
      }

      // Monthly format:
      // 2025-09 → Sep 2025
      if (/^\d{4}-\d{2}$/.test(label)) {
        const [year, month] = label.split("-");

        const date = new Date(Number(year), Number(month) - 1, 1);

        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }

      // Daily format:
      // 2026-08-08 → Aug 8
      if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
        const [year, month, day] = label.split("-");

        const date = new Date(Number(year), Number(month) - 1, Number(day));

        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      return label;
    });
  }

  function renderChart() {
    const chartOptions = {
      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true,
          position: "bottom",

          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 14,
            usePointStyle: false,
          },

          ...(type === "doughnut" || type === "pie"
            ? {
                position: "bottom",
              }
            : {}),
        },

        tooltip: {
          enabled: true,
        },
      },

      ...options,
    };

    const chartData = getChartData();

    switch (type) {
      case "bar":
        return <Bar data={chartData} options={chartOptions} />;

      case "doughnut":
        return <Doughnut data={chartData} options={chartOptions} />;

      case "pie":
        return <Pie data={chartData} options={chartOptions} />;

      case "line":
      default:
        return <Line data={chartData} options={chartOptions} />;
    }
  }

  return (
    <section className="analytics-chart-card">
      {title && (
        <div className="analytics-chart-header">
          <h3>{title}</h3>
        </div>
      )}

      <div className="analytics-chart-container">{renderChart()}</div>
    </section>
  );
}
