"use client";

import "@/styles/analytics-kpi.css";

import {
  FaUsers,
  FaChartLine,
  FaMoneyBillWave,
  FaHome,
  FaCreditCard,
} from "react-icons/fa";

const iconMap = {
  leads: FaUsers,
  sales: FaChartLine,
  revenue: FaMoneyBillWave,
  properties: FaHome,
  payments: FaCreditCard,
};

export default function AnalyticsKpiCards({ cards = [] }) {
  return (
    <div className="analytics-kpi-grid">
      {cards.map((card) => {
        const Icon = iconMap[card.id] || FaChartLine;

        return (
          <div className="analytics-kpi-card" key={card.id}>
            <div className="analytics-kpi-main">
              <div className="analytics-kpi-icon">
                <Icon />
              </div>

              <div className="analytics-kpi-content">
                <div className="analytics-kpi-label">{card.label}</div>
              </div>
            </div>
            <div className="analytics-kpi-value">
              {Number(card.value || 0).toLocaleString()}
            </div>

            {card.change !== null && card.change !== undefined && (
              <div
                className={`analytics-kpi-change ${
                  card.change >= 0 ? "positive" : "negative"
                }`}
              >
                <span>{card.change >= 0 ? "↑" : "↓"}</span>
                {Math.abs(card.change)}%<small>vs previous period</small>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
