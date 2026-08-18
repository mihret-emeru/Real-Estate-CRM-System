"use client";

import { Bar, Line, Doughnut } from "react-chartjs-2";

import "@/styles/report-chart.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { chartColors } from "@/utils/chartColors";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
);

export default function ReportChart({ type = "bar", data, title }) {
  if (!data) {
    return null;
  }

  function getChartData() {
    if (!data?.datasets) {
      return data;
    }

    return {
      ...data,

      datasets: data.datasets.map((dataset) => {
        /*
         * Doughnut chart
         * Uses the same reusable palette
         * as AnalyticsChart.
         */
        if (type === "doughnut") {
          return {
            ...dataset,

            backgroundColor: chartColors.palette,

            borderColor: "#ffffff",

            borderWidth: 2,
          };
        }

        /*
         * Bar chart
         * Applies only to bar charts.
         */
        if (type === "bar") {
          return {
            ...dataset,

            backgroundColor: chartColors.palette,

            borderColor: "#ffffff",

            borderWidth: 1,

            barThickness: 28,

            maxBarThickness: 32,

            borderRadius: 6,
          };
        }

        /*
         * Other report charts
         * Keep the original data untouched.
         */
        return {
          ...dataset,
        };
      }),
    };
  }

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
      },

      title: {
        display: Boolean(title),
        text: title,
      },
    },
  };

  const chartData = getChartData();

  return (
    <div className="report-chart">
      {type === "bar" && <Bar data={chartData} options={chartOptions} />}

      {type === "line" && <Line data={chartData} options={chartOptions} />}

      {type === "doughnut" && (
        <Doughnut data={chartData} options={chartOptions} />
      )}
    </div>
  );
}
