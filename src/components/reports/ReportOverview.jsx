"use client";

import {
  FaHome,
  FaUsers,
  FaFileContract,
  FaMoneyBillWave,
  FaUserTie,
} from "react-icons/fa";

export default function ReportOverview({
  title = "Daily Overview",
  period = "",
  summary = {},
}) {
  const cards = [
    {
      key: "properties",
      label: "Properties Added",
      value: summary.properties ?? 0,
      icon: <FaHome />,
      description: "Properties added during this period",
    },
    {
      key: "leads",
      label: "New Leads",
      value: summary.leads ?? 0,
      icon: <FaUsers />,
      description: "New leads received",
    },
    {
      key: "sales",
      label: "Sales",
      value: summary.sales ?? 0,
      icon: <FaFileContract />,
      description: "Sales completed",
    },
    {
      key: "payments",
      label: "Payments",
      value: summary.payments ?? 0,
      icon: <FaMoneyBillWave />,
      description: "Payments recorded",
    },
    {
      key: "agents",
      label: "Agent Activity",
      value: summary.agents ?? 0,
      icon: <FaUserTie />,
      description: "Agents active during this period",
    },
  ];

  return (
    <section className="report-overview">
      <div className="report-overview-header">
        <div>
          <h2>{title}</h2>

          {period && <p className="report-overview-period">{period}</p>}
        </div>
      </div>

      <div className="report-overview-grid">
        {cards.map((card) => (
          <div className="report-overview-card" key={card.key}>
            <div className="report-overview-card-icon">{card.icon}</div>

            <div className="report-overview-card-content">
              <span className="report-overview-card-label">{card.label}</span>

              <strong className="report-overview-card-value">
                {card.value}
              </strong>

              <small className="report-overview-card-description">
                {card.description}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

