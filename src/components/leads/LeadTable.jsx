"use client";

import { useEffect, useState } from "react";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadScoreBadge from "./LeadScoreBadge";
import LeadActions from "./LeadActions";
import { formatLeadSource } from "@/utils/LeadFormat";

export default function LeadTable({ leads = [], onDelete }) {
  const [page, setPage] = useState(1);

  const limit = 10;

  const totalPages = Math.ceil(leads.length / limit);

  useEffect(() => {
    // Reset to first page when the leads list changes
    setPage(1);
  }, [leads]);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const currentLeads = leads.slice(startIndex, endIndex);

  function handleDelete(id) {
    onDelete?.(id);

    // If deleting the last item on the current page,
    // move back one page.
    if (currentLeads.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
  }

  return (
    <div className="lead-table-container">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Source</th>
            <th>Score</th>
            <th>Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan="7" className="empty-state">
                No leads found.
              </td>
            </tr>
          ) : (
            currentLeads.map((lead) => (
              <tr key={lead._id}>
                <td>{lead.fullName}</td>

                <td>{lead.phone}</td>

                <td>{formatLeadSource(lead.source)}</td>

                <td>{lead.leadScore}</td>

                <td>
                  <LeadScoreBadge score={lead.leadScore} />
                </td>

                <td>
                  <LeadStatusBadge status={lead.status} />
                </td>

                <td>
                  <LeadActions leadId={lead._id} onDelete={handleDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <>
          <div className="lead-pagination">
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

          <div className="lead-pagination-info">
            Showing {startIndex + 1} - {Math.min(endIndex, leads.length)} of{" "}
            {leads.length} leads
          </div>
        </>
      )}
    </div>
  );
}
