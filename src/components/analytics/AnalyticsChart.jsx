"use client";

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

export default function AnalyticsChart({
  type = "line",
  title = "",
  data = {},
  options = {},
}) {
  function renderChart() {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },

        tooltip: {
          enabled: true,
        },
      },

      ...options,
    };

    switch (type) {
      case "bar":
        return <Bar data={data} options={chartOptions} />;

      case "doughnut":
        return <Doughnut data={data} options={chartOptions} />;

      case "pie":
        return <Pie data={data} options={chartOptions} />;

      case "line":
      default:
        return <Line data={data} options={chartOptions} />;
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

