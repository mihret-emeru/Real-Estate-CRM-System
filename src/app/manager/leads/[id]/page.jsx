"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaChartLine, FaFire, FaFlag, FaGlobe } from "react-icons/fa";

import { useParams, useRouter } from "next/navigation";
import { calculateLeadLevel } from "@/utils/leadScore";
import "@/styles/leaddetails.css";

export default function LeadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLead() {
      try {
        const response = await fetch(`/api/leads/${id}`);

        const data = await response.json();

        if (data.success) {
          setLead(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchLead();
    }
  }, [id]);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!lead) {
    return <h2>Lead not found.</h2>;
  }

  const leadLevel = calculateLeadLevel(lead.leadScore);
  async function handleDelete() {
    const confirmed = confirm("Are you sure you want to delete this lead?");

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/manager/leads");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="lead-details-page">
      <div className="lead-details-header">
        <div>
          <h1>{lead.fullName}</h1>

          <p>{lead.source.replace("_", " ")}</p>
        </div>

        <div className={`lead-status ${lead.status}`}>{lead.status}</div>
      </div>
      <div className="lead-info-grid">
        <div className="info-card score-card">
          <div className="card-icon">
            <FaChartLine />
          </div>
          <span>Lead Score</span>
          <h3>{lead.leadScore}</h3>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <FaFlag />
          </div>
          <span>Status</span>
          <h3>{lead.status}</h3>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <FaFire />
          </div>

          <span>Lead Level</span>

          <h3>{leadLevel.charAt(0).toUpperCase() + leadLevel.slice(1)}</h3>
        </div>

        <div className="info-card">
          <div className="card-icon">
            <FaGlobe />
          </div>

          <span>Source</span>
          <h3>{lead.source.replace("_", " ")}</h3>
        </div>
      </div>
      <div className="property-section">
        <h2>Contact Information</h2>

        <div className="contact-grid">
          <div className="contact-item">
            <span>Full Name</span>
            <h4>{lead.fullName}</h4>
          </div>

          <div className="contact-item">
            <span>Email</span>
            <h4>{lead.email}</h4>
          </div>

          <div className="contact-item">
            <span>Phone</span>
            <h4>{lead.phone}</h4>
          </div>
        </div>
      </div>
      <div className="property-section">
        <h2>Notes</h2>

        <div className="lead-note-box">
          {lead.notes || "No notes available."}
        </div>
      </div>
      <div className="property-actions">
        <Link
          href={`/manager/leads/${lead._id}/edit`}
          className="details-edit-btn"
        >
          Edit Lead
        </Link>

        <button className="details-delete-btn" onClick={handleDelete}>
          Delete Lead
        </button>
      </div>
    </div>
  );
}

