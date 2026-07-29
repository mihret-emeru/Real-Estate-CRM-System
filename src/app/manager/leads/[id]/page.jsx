"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LeadTimeline from "@/components/leads/LeadTimeline";
import {
  FaChartLine,
  FaFire,
  FaFlag,
  FaGlobe,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
  FaStickyNote,
  FaAddressBook,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

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

  function formatLeadSource(source) {
    switch (source) {
      case "client_registration":
        return "Client Registration";

      case "website":
        return "Website";

      case "facebook_ad":
        return "Facebook Ad";

      case "phone_call":
        return "Phone Call";

      case "office_visit":
        return "Office Visit";

      case "referral":
        return "Referral";

      default:
        return source
          .replaceAll("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }

  return (
    <div className="lead-details-page">
      <div className="lead-details-header">
        <div>
          <Link href="/manager/leads" className="back-link">
            <FaArrowLeft />
            Back to Leads
          </Link>

          <h1>{lead.fullName}</h1>

          <p>{formatLeadSource(lead.source)}</p>
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
        <h2 className="section-title">
          <FaAddressBook />
          Contact Information
        </h2>

        <div className="contact-grid">
          <div className="contact-item">
            <div className="contact-icon">
              <FaUser />
            </div>
            <div className="contact-content">
              <span>Full Name</span>
              <h4>{lead.fullName}</h4>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <FaEnvelope />
            </div>
            <div className="contact-content">
              <span>Email</span>
              <h4>{lead.email}</h4>
            </div>
          </div>

          <div className="contact-item">
            <div className="contact-icon">
              <FaPhone />
            </div>
            <div className="contact-content">
              <span>Phone</span>
              <h4>{lead.phone}</h4>
            </div>
          </div>
        </div>
      </div>
      <div className="property-section">
        <h2 className="section-title">
          <FaStickyNote />
          Notes
        </h2>
        <div className="lead-note-box">
          {lead.notes ? (
            lead.notes
          ) : (
            <span className="empty-note">No notes have been added yet.</span>
          )}
        </div>
        <h2>Activity Timeline</h2>

        <LeadTimeline activities={lead.activities} />
      </div>
      <div className="details-actions">
        <Link
          href={`/manager/leads/${lead._id}/edit`}
          className="details-edit-btn"
        >
          <FaEdit />
          Edit Lead
        </Link>

        <button className="details-delete-btn" onClick={handleDelete}>
          <FaTrash />
          Delete Lead
        </button>
      </div>
    </div>
  );
}
