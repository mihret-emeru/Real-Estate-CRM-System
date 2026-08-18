"use client";

import { useEffect, useState } from "react";

import ContractStatusBadge from "./ContractStatusBadge";
import ContractActions from "./ContractActions";

import "@/styles/contract-table.css";

export default function ContractTable({ contracts = [], onDelete }) {
  const [page, setPage] = useState(1);

  const limit = 10;

  const totalPages = Math.ceil(contracts.length / limit);

  useEffect(() => {
    setPage(1);
  }, [contracts]);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const currentContracts = contracts.slice(startIndex, endIndex);

  function handleDelete(id) {
    onDelete?.(id);

    // If deleting the last contract
    // on the current page, go back one page.
    if (currentContracts.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
  }

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
            currentContracts.map((contract) => (
              <tr key={contract._id}>
                <td>{contract.contractNumber}</td>

                <td>
                  {contract.client?.name || contract.lead?.fullName || "-"}
                </td>

                <td>{contract.property?.title || "-"}</td>

                <td>{Number(contract.salePrice || 0).toLocaleString()} ETB</td>

                <td>
                  <ContractStatusBadge status={contract.status} />
                </td>

                <td>{new Date(contract.createdAt).toLocaleDateString()}</td>

                <td>
                  <ContractActions
                    contract={contract}
                    onDelete={handleDelete}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <>
          <div className="contract-pagination">
            <button
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  className={page === pageNumber ? "active" : ""}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>

          <div className="contract-pagination-info">
            Showing {startIndex + 1} - {Math.min(endIndex, contracts.length)} of{" "}
            {contracts.length} contracts
          </div>
        </>
      )}
    </div>
  );
}
