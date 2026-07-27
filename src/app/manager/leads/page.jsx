"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LeadTable from "@/components/leads/LeadTable";

export default function LeadsPage() {
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

  return (
    <div className="leads-page">
      <div className="page-title">
        <div>
          <h1>Lead Management</h1>
          <p>Manage and track potential clients</p>
        </div>

        <Link href="/manager/leads/add">Add Lead</Link>
      </div>

      <LeadTable leads={leads} onDelete={handleDelete} />
    </div>
  );
}

