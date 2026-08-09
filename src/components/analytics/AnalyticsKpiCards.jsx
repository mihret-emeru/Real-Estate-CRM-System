"use client";

export default function AnalyticsKpiCards({ cards = [] }) {
  if (!Array.isArray(cards) || cards.length === 0) {
    return null;
  }

  return (
    <div className="analytics-kpi-grid">
      {cards.map((card) => (
        <div className="analytics-kpi-card" key={card.id}>
          <div className="analytics-kpi-card-content">
            <span className="analytics-kpi-label">{card.label}</span>

            <strong className="analytics-kpi-value">{card.value}</strong>

            {card.description && (
              <p className="analytics-kpi-description">{card.description}</p>
            )}
          </div>

          {card.change !== null && card.change !== undefined && (
            <div
              className={`analytics-kpi-change ${
                card.change >= 0 ? "positive" : "negative"
              }`}
            >
              <span>{card.change >= 0 ? "↑" : "↓"}</span>

              <span>{Math.abs(card.change)}%</span>

              <small>vs previous period</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

