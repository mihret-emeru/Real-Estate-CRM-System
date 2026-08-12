"use client";

import ContractStatusBadge from "./ContractStatusBadge";
import ContractActions from "./ContractActions";
import "@/styles/contract-table.css";

export default function ContractTable({ contracts, onDelete }) {
  return (
    <div className="contract-table-container">
      <table className="contract-table">
        <thead>
          <tr>
            <th>Contract #</th>

            <th>Client</th>

            <th>Property</th>

            <th>Sale Price</th>

            <th>Status</th>

            <th>Created</th>

            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {contracts.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-state">
                No contracts found.
              </td>
            </tr>
          ) : (
            contracts.map((contract) => (
              <tr key={contract._id}>
                <td>{contract.contractNumber}</td>

                <td>{contract.client?.name}</td>

                <td>{contract.property?.title}</td>

                <td>
                  {contract.contractType === "uploaded"
                    ? "—"
                    : `${Number(contract.salePrice).toLocaleString()} ETB`}
                </td>

                <td>
                  <ContractStatusBadge status={contract.status} />
                </td>

                <td>{new Date(contract.createdAt).toLocaleDateString()}</td>

                <td>
                  <ContractActions contract={contract} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
