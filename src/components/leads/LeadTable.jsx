"use client";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadScoreBadge from "./LeadScoreBadge";
import LeadActions from "./LeadActions";
import { formatLeadSource } from "@/utils/leadFormat";

export default function LeadTable({ leads = [], onDelete }) {
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
              <td colSpan="6" className="empty-state">
                No leads found.
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
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
                  <LeadActions leadId={lead._id} onDelete={onDelete} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
