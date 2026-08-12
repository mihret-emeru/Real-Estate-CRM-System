"use client";

import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import "@/styles/report-chart.css";
import { chartColors } from "@/utils/chartColors";

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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },

      title: {
        display: Boolean(title),
        text: title,
      },
    },
  };
  function getChartData() {
  if (!data?.datasets) {
    return data;
  }

  return {
    ...data,

    datasets: data.datasets.map((dataset) => ({
      ...dataset,

      backgroundColor:
        type === "doughnut" || type === "pie"
          ? chartColors
          : dataset.backgroundColor,

      borderColor:
        type === "doughnut" || type === "pie"
          ? "#ffffff"
          : dataset.borderColor,

      borderWidth:
        type === "doughnut" || type === "pie"
          ? 2
          : dataset.borderWidth,
    })),
  };
}

  return (
    <div className="report-chart">
      {type === "bar" && <Bar data={data} options={chartOptions} />}

      {type === "line" && <Line data={data} options={chartOptions} />}

      {type === "pie" && <Pie data={data} options={chartOptions} />}

      {type === "doughnut" && <Doughnut data={data} options={chartOptions} />}
    </div>
  );
}

