"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LeadTable from "@/components/leads/LeadTable";
import CustomDropdown from "@/components/common/CustomDropdown";
import {
  FaPlus,
  FaUsers,
  FaUserPlus,
  FaFire,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import "@/styles/leaddetails.css";

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeads() {
    try {
      const response = await fetch("/api/leads");

      const data = await response.json();

      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  async function handleDelete(id) {
    const confirmDelete = confirm("Are you sure you want to delete this lead?");

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchLeads();
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return <h2>Loading leads...</h2>;
  }
  const filteredLeads = leads.filter((lead) => {
    const searchMatch =
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);

    const statusMatch = statusFilter === "" || lead.status === statusFilter;

    const sourceMatch = sourceFilter === "" || lead.source === sourceFilter;

    return searchMatch && statusMatch && sourceMatch;
  });

  const totalLeads = leads.length;

  const newLeads = leads.filter((lead) => lead.status === "new").length;

  const hotLeads = leads.filter((lead) => lead.leadScore >= 70).length;

  const wonLeads = leads.filter((lead) => lead.status === "won").length;
  const lostLeads = leads.filter((lead) => lead.status === "lost").length;

  return (
    <div className="leads-page">
      <div className="page-title">
        <div>
          <h1>Lead Management</h1>
          <p>Manage and track potential clients</p>
        </div>

        <Link href="/manager/leads/add" className="add-lead-btn">
          <FaPlus />
          Add Lead
        </Link>
      </div>

      <div className="lead-summary">
        <div className="summary-card">
          <FaUsers className="summary-icon" />

          <div>
            <span>Total Leads</span>
            <h2>{totalLeads}</h2>
          </div>
        </div>

        <div className="summary-card">
          <FaUserPlus className="summary-icon" />

          <div>
            <span>New Leads</span>
            <h2>{newLeads}</h2>
          </div>
        </div>

        <div className="summary-card">
          <FaFire className="summary-icon" />

          <div>
            <span>Hot Leads</span>
            <h2>{hotLeads}</h2>
          </div>
        </div>

        <div className="summary-card">
          <FaCheckCircle className="summary-icon" />

          <div>
            <span>Won Leads</span>
            <h2>{wonLeads}</h2>
          </div>
        </div>

        <div className="summary-card">
          <FaTimesCircle className="summary-icon" />

          <div>
            <span>Lost Leads</span>

            <h2>{lostLeads}</h2>
          </div>
        </div>
      </div>

      <div className="lead-toolbar">
        <div className="lead-search">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="lead-filters">
          <CustomDropdown
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="All Status"
            options={[
              { value: "", label: "All Status" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "qualified", label: "Qualified" },
              { value: "negotiation", label: "Negotiation" },
              { value: "won", label: "Won" },
              { value: "lost", label: "Lost" },
            ]}
          />

          <CustomDropdown
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value)}
            placeholder="All Sources"
            options={[
              { value: "", label: "All Sources" },
              { value: "phone_call", label: "Phone Call" },
              { value: "office_visit", label: "Office Visit" },
              { value: "referral", label: "Referral" },
              { value: "facebook_ad", label: "Facebook Ad" },
              { value: "website", label: "Website" },
              {
                value: "client_registration",
                label: "Client Registration",
              },
            ]}
          />
        </div>
      </div>

      <LeadTable leads={filteredLeads} onDelete={handleDelete} />
    </div>
  );
}
