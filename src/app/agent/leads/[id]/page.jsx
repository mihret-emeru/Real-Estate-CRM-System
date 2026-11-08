"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";
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

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState({
    type: "",
    message: "",
  });

  const [downPayment, setDownPayment] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState("12");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [terms, setTerms] = useState("");

  const [assignedProperties, setAssignedProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertySearch, setPropertySearch] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");

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

  useEffect(() => {
    if (!requestOpen) return;

    let cancelled = false;

    async function loadAssignedProperties() {
      try {
        setPropertiesLoading(true);

        const response = await fetch("/api/agent/properties");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load properties.");
        }

        if (!cancelled) {
          setAssignedProperties(
            result.data.filter((property) => property.status === "available"),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setRequestFeedback({
            type: "error",
            message: error.message || "Failed to load assigned properties.",
          });
        }
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    }

    loadAssignedProperties();

    return () => {
      cancelled = true;
    };
  }, [requestOpen]);

  async function handleContractRequest(event) {
    event.preventDefault();

    if (!lead?._id) return;

    if (!selectedPropertyId) {
      setRequestFeedback({
        type: "error",
        message: "Please select a property.",
      });
      return;
    }

    try {
      setRequestSubmitting(true);
      setRequestFeedback({ type: "", message: "" });

      const response = await fetch("/api/agent/contract-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead._id,
          propertyId: selectedPropertyId,
          downPayment,
          installmentMonths,
          paymentFrequency,
          terms,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit contract request.");
      }

      setRequestFeedback({
        type: "success",
        message:
          "Contract request submitted successfully. The manager has been notified.",
      });

      setRequestOpen(false);
    } catch (error) {
      setRequestFeedback({
        type: "error",
        message: error.message || "Failed to submit contract request.",
      });
    } finally {
      setRequestSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="agent-lead-view-page">
        <div className="agent-lead-view-state">
          <LoadingSpinner message="Loading lead..." />
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

          <BackLink href="/agent/leads" label="Back to Leads" />
        </div>
      </div>
    );
  }

  const property = lead.interestedProperty;

  const selectedProperty = assignedProperties.find(
    (item) => item._id.toString() === selectedPropertyId,
  );

  const filteredProperties = assignedProperties.filter((item) =>
    `${item.title} ${item.location?.city || ""} ${item.location?.subCity || ""}`
      .toLowerCase()
      .includes(propertySearch.toLowerCase()),
  );

  return (
    <div className="agent-lead-view-page">
      <div className="agent-lead-view-top">
        <BackLink href="/agent/leads" label="Back to Leads" />
      </div>

      <div className="agent-lead-view-header">
        <div>
          <span>LEAD DETAILS</span>

          <h1>{lead.fullName}</h1>

          <p>Review lead information, interest, and activity history.</p>
        </div>

        <div className="agent-lead-view-status">
          <LeadStatusBadge status={lead.status} />

          {lead.status === "negotiation" && (
            <button
              type="button"
              className="agent-contract-request-button"
              onClick={() => {
                setRequestFeedback({ type: "", message: "" });
                setRequestOpen(!requestOpen);
              }}
            >
              Request Contract
            </button>
          )}
        </div>
      </div>

      <div className="agent-lead-view-grid">
        {requestFeedback.message && (
          <div className={`agent-contract-feedback ${requestFeedback.type}`}>
            {requestFeedback.message}
          </div>
        )}

        {requestOpen && (
          <section className="agent-contract-request-card">
            <div className="agent-lead-card-header">
              <div>
                <span>CONTRACT REQUEST</span>
                <h2>Request Manager Approval</h2>
              </div>
            </div>

            <form onSubmit={handleContractRequest}>
              <div className="agent-contract-form-group">
                <label htmlFor="propertySearch">Search Assigned Property</label>

                <input
                  id="propertySearch"
                  type="text"
                  value={propertySearch}
                  onChange={(event) => {
                    setPropertySearch(event.target.value);
                    setSelectedPropertyId("");
                  }}
                  placeholder="Type property name or location..."
                  autoComplete="off"
                />

                {propertiesLoading && <p>Loading assigned properties...</p>}

                {!propertiesLoading &&
                  propertySearch.trim() &&
                  !selectedPropertyId && (
                    <div className="agent-property-search-results">
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((item) => (
                          <button
                            type="button"
                            key={item._id}
                            onClick={() => {
                              setSelectedPropertyId(item._id.toString());
                              setPropertySearch(item.title);
                              setDownPayment("");
                            }}
                          >
                            <strong>{item.title}</strong>
                            <span>
                              {item.location?.city || "Location unavailable"} ·{" "}
                              {Number(item.price).toLocaleString()}{" "}
                              {item.currency || "ETB"}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p>No matching available properties found.</p>
                      )}
                    </div>
                  )}
              </div>

              {selectedProperty && (
                <>
                  <div className="agent-contract-property-price">
                    <span>Selected Property</span>
                    <strong>{selectedProperty.title}</strong>

                    <span>Fixed Property Price</span>
                    <strong>
                      {Number(selectedProperty.price).toLocaleString()}{" "}
                      {selectedProperty.currency || "ETB"}
                    </strong>

                    <small>
                      Payment type:{" "}
                      {selectedProperty.paymentType === "installment"
                        ? "Installment"
                        : "Full Payment"}
                    </small>
                  </div>

                  {selectedProperty.paymentType === "installment" && (
                    <>
                      <div className="agent-contract-form-group">
                        <label htmlFor="downPayment">Down Payment</label>
                        <input
                          id="downPayment"
                          type="number"
                          min="0"
                          max={Number(selectedProperty.price) - 0.01}
                          step="0.01"
                          value={downPayment}
                          onChange={(event) =>
                            setDownPayment(event.target.value)
                          }
                          placeholder="Enter down payment"
                          required
                        />
                      </div>

                      <div className="agent-contract-form-group">
                        <label htmlFor="installmentMonths">
                          Installment Duration (Months)
                        </label>
                        <input
                          id="installmentMonths"
                          type="number"
                          min="1"
                          step="1"
                          value={installmentMonths}
                          onChange={(event) =>
                            setInstallmentMonths(event.target.value)
                          }
                          required
                        />
                      </div>

                      <div className="agent-contract-form-group">
                        <label htmlFor="paymentFrequency">
                          Payment Frequency
                        </label>
                        <select
                          id="paymentFrequency"
                          value={paymentFrequency}
                          onChange={(event) =>
                            setPaymentFrequency(event.target.value)
                          }
                          required
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </>
                  )}

                  {selectedProperty.paymentType === "full_payment" && (
                    <p className="agent-contract-full-payment">
                      The client will pay the full property price.
                    </p>
                  )}
                </>
              )}

              <div className="agent-contract-form-group">
                <label htmlFor="contractTerms">
                  Additional Terms (Optional)
                </label>
                <textarea
                  id="contractTerms"
                  rows="4"
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  placeholder="Enter additional conditions or agreements..."
                />
              </div>

              <div className="agent-contract-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setRequestOpen(false);
                    setSelectedPropertyId("");
                    setPropertySearch("");
                  }}
                  disabled={requestSubmitting}
                  className="agent-contract-cancel-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={requestSubmitting || !selectedPropertyId}
                  className="agent-contract-submit-button"
                >
                  {requestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </section>
        )}
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
