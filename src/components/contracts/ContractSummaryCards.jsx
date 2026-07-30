"use client";

export default function ContractSummaryCards({ contracts }) {
  const totalContracts = contracts.length;

  const activeContracts = contracts.filter(
    (contract) =>
      contract.status === "signed" || contract.status === "pending_signature",
  ).length;

  const completedContracts = contracts.filter(
    (contract) => contract.status === "completed",
  ).length;

  const cancelledContracts = contracts.filter(
    (contract) => contract.status === "cancelled",
  ).length;

  const totalSales = contracts.reduce(
    (sum, contract) => sum + Number(contract.salePrice || 0),
    0,
  );

  return (
    <div className="contract-summary-grid">
      <div className="summary-card">
        <h3>Total Contracts</h3>
        <h2>{totalContracts}</h2>
      </div>

      <div className="summary-card">
        <h3>Active</h3>
        <h2>{activeContracts}</h2>
      </div>

      <div className="summary-card">
        <h3>Completed</h3>
        <h2>{completedContracts}</h2>
      </div>

      <div className="summary-card">
        <h3>Cancelled</h3>
        <h2>{cancelledContracts}</h2>
      </div>

      <div className="summary-card">
        <h3>Total Sales</h3>
        <h2>${totalSales.toLocaleString()}</h2>
      </div>
    </div>
  );
}

