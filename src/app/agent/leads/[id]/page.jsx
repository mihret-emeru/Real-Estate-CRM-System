"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaChartLine,
} from "react-icons/fa";

import LeadStatusBadge from "@/components/leads/LeadStatusBadge";
import LeadScoreBadge from "@/components/leads/LeadScoreBadge";
import LeadTimeline from "@/components/leads/LeadTimeline";

import "@/styles/agent/lead-view.css";

export default function AgentLeadViewPage() {
  const params = useParams();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLead() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/leads/${params.id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load lead.");
        }

        setLead(result.data);
      } catch (error) {
        console.error("Failed to load lead:", error);
        setError(error.message || "Failed to load lead.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="agent-lead-view-page">
        <div className="agent-lead-view-state">
          <p>Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="agent-lead-view-page">
        <div className="agent-lead-view-state">
          <h2>Unable to Load Lead</h2>
          <p>{error || "Lead not found."}</p>

          <Link href="/agent/leads" className="agent-lead-back-btn">
            <FaArrowLeft />
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const property = lead.interestedProperty;

  return (
    <div className="agent-lead-view-page">
      <div className="agent-lead-view-top">
        <Link href="/agent/leads" className="agent-lead-back-link">
          <FaArrowLeft />
          Back to Leads
        </Link>
      </div>

      <div className="agent-lead-view-header">
        <div>
          <span>LEAD DETAILS</span>

          <h1>{lead.fullName}</h1>

          <p>Review lead information, interest, and activity history.</p>
        </div>

        <div className="agent-lead-view-status">
          <LeadStatusBadge status={lead.status} />
        </div>
      </div>

      <div className="agent-lead-view-grid">
        <section className="agent-lead-info-card">
          <div className="agent-lead-card-header">
            <div>
              <span>CONTACT INFORMATION</span>
              <h2>Lead Information</h2>
            </div>

            <FaEnvelope />
          </div>

          <div className="agent-lead-info-list">
            <div>
              <span>Name</span>
              <strong>{lead.fullName || "-"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{lead.email || "-"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{lead.phone || "-"}</strong>
            </div>

            <div>
              <span>Source</span>
              <strong>{lead.source || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="agent-lead-info-card">
          <div className="agent-lead-card-header">
            <div>
              <span>LEAD PERFORMANCE</span>
              <h2>Lead Score</h2>
            </div>

            <FaChartLine />
          </div>

          <div className="agent-lead-score-content">
            <LeadScoreBadge score={lead.leadScore} />

            <p>
              This score represents the current level of interest associated
              with this lead.
            </p>
          </div>
        </section>
      </div>

      <section className="agent-lead-property-card">
        <div className="agent-lead-card-header">
          <div>
            <span>PROPERTY INTEREST</span>
            <h2>Interested Property</h2>
          </div>

          <FaBuilding />
        </div>

        {!property ? (
          <div className="agent-lead-no-property">
            <p>This lead is not currently connected to a property.</p>
          </div>
        ) : (
          <div className="agent-lead-property-content">
            <div className="agent-lead-property-image">
              <img
                src={property.images?.[0] || "/images/property-placeholder.jpg"}
                alt={property.title}
              />
            </div>

            <div className="agent-lead-property-details">
              <h3>{property.title}</h3>

              <p className="agent-lead-property-location">
                <FaMapMarkerAlt />
                {property.location?.city || "-"}
                {property.location?.subCity
                  ? `, ${property.location.subCity}`
                  : ""}
              </p>

              <strong>
                {Number(property.price || 0).toLocaleString()}{" "}
                {property.currency || "ETB"}
              </strong>

              <p className="agent-lead-property-type">
                {property.propertyType || "-"}
              </p>

              <Link
                href={`/agent/properties/${property._id}`}
                className="agent-lead-property-link"
              >
                View Property
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="agent-lead-timeline-card">
        <div className="agent-lead-card-header">
          <div>
            <span>ACTIVITY HISTORY</span>
            <h2>Lead Timeline</h2>
          </div>

          <FaPhone />
        </div>

        <LeadTimeline activities={lead.activities} />
      </section>
    </div>
  );
}

