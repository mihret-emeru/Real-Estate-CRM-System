"use client";

import "@/styles/contract-summary-cards.css";
import {
  FaFileContract,
  FaClipboardCheck,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function ContractSummaryCards({ contracts }) {
  const totalContracts = contracts.length;

  const activeContracts = contracts.filter(
    (contract) =>
      contract.status === "signed" || contract.status === "pending_signature",
  ).length;

  const completedContracts = contracts.filter(
    (contract) =>
      contract.status === "completed" || contract.status === "signed",
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
        <div className="summary-card-heading">
          <FaFileContract />
          <h3>Total Contracts</h3>
        </div>

        <h2>{totalContracts}</h2>
      </div>

      <div className="summary-card">
        <div className="summary-card-heading">
          <FaClipboardCheck />
          <h3>Active</h3>
        </div>

        <h2>{activeContracts}</h2>
      </div>

      <div className="summary-card">
        <div className="summary-card-heading">
          <FaCheckCircle />
          <h3>Completed</h3>
        </div>

        <h2>{completedContracts}</h2>
      </div>

      <div className="summary-card">
        <div className="summary-card-heading">
          <FaTimesCircle />
          <h3>Cancelled</h3>
        </div>

        <h2>{cancelledContracts}</h2>
      </div>

      <div className="summary-card">
        <div className="summary-card-heading">
          <FaMoneyBillWave />
          <h3>Total Sales</h3>
        </div>

        <h2>{totalSales.toLocaleString()} ETB</h2>
      </div>
    </div>
  );
}
