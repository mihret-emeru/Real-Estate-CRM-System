"use client";

import { useEffect, useMemo, useState } from "react";
import { FaUsers, FaUserCheck, FaPhone, FaTrophy } from "react-icons/fa";
import CustomDropdown from "@/components/common/CustomDropdown";

import LeadTable from "@/components/leads/LeadTable";
import AgentLeadActions from "@/components/agent/AgentLeadActions";

import "@/styles/agent/lead-management.css";

export default function AgentLeadManagementPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/agent/leads");

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load leads.");
        }

        console.log("Agent leads:", result.data);
        setLeads(result.data || []);
      } catch (error) {
        console.error("Failed to load agent leads:", error);

        setError(error.message || "Failed to load agent leads.");
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") {
      return leads;
    }

    return leads.filter((lead) => lead.status === statusFilter);
  }, [leads, statusFilter]);

  const newLeads = leads.filter((lead) => lead.status === "new").length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "contacted",
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "qualified",
  ).length;

  const wonLeads = leads.filter((lead) => lead.status === "won").length;

  if (loading) {
    return (
      <div className="agent-leads-page">
        <div className="agent-leads-state">
          <p>Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-leads-page">
        <div className="agent-leads-state">
          <h2>Unable to Load Leads</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-leads-page">
      <div className="agent-leads-header">
        <div>
          <span>CLIENT RELATIONSHIP MANAGEMENT</span>

          <h1>Lead Management</h1>

          <p>
            Manage and follow up with clients interested in your assigned
            properties.
          </p>
        </div>

        <div className="agent-leads-total">
          <strong>{leads.length}</strong>
          <span>Total Leads</span>
        </div>
      </div>

      <div className="agent-lead-summary">
        <div className="agent-lead-summary-card">
          <div className="agent-lead-summary-icon">
            <FaUsers />
          </div>

          <div>
            <span>New Leads</span>
            <strong>{newLeads}</strong>
          </div>
        </div>

        <div className="agent-lead-summary-card">
          <div className="agent-lead-summary-icon">
            <FaPhone />
          </div>

          <div>
            <span>Contacted</span>
            <strong>{contactedLeads}</strong>
          </div>
        </div>

        <div className="agent-lead-summary-card">
          <div className="agent-lead-summary-icon">
            <FaUserCheck />
          </div>

          <div>
            <span>Qualified</span>
            <strong>{qualifiedLeads}</strong>
          </div>
        </div>

        <div className="agent-lead-summary-card">
          <div className="agent-lead-summary-icon">
            <FaTrophy />
          </div>

          <div>
            <span>Won</span>
            <strong>{wonLeads}</strong>
          </div>
        </div>
      </div>

      <div className="agent-leads-toolbar">
        <div>
          <h2>My Leads</h2>

          <p>Leads generated from your assigned properties.</p>
        </div>
        <CustomDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            {
              value: "all",
              label: "All Statuses",
            },
            {
              value: "new",
              label: "New",
            },
            {
              value: "contacted",
              label: "Contacted",
            },
            {
              value: "qualified",
              label: "Qualified",
            },
            {
              value: "negotiation",
              label: "Negotiation",
            },
            {
              value: "won",
              label: "Won",
            },
            {
              value: "lost",
              label: "Lost",
            },
          ]}
        />
      </div>

      <div className="agent-leads-table">
        <LeadTable leads={filteredLeads} actionsComponent={AgentLeadActions} />
      </div>
    </div>
  );
}

