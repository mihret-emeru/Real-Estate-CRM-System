"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";

import {
  FaArrowLeft,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaCar,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaExternalLinkAlt,
} from "react-icons/fa";

import "@/styles/agent/property-view.css";

export default function AgentPropertyViewPage() {
  const params = useParams();
  const propertyId = params?.id;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  async function fetchProperty() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/agent/properties/${propertyId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load property.");
      }

      setProperty(data.data);
    } catch (error) {
      console.error("Agent property detail error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load property.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  function formatCurrency(amount, currency = "ETB") {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatStatus(status) {
    if (!status) return "-";

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  if (loading) {
    return (
      <div className="agent-property-view-page">
        <div className="agent-property-view-loading">
          <LoadingSpinner message="Loading property..." />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="agent-property-view-page">
        <div className="agent-property-view-error">
          <FaBuilding />

          <h2>Unable to load property</h2>

          <p>{error || "The requested property could not be found."}</p>

          <div className="agent-property-view-error-actions">
            <button onClick={fetchProperty}>Try Again</button>

            <BackLink href="/agent/properties" label="Back to Properties" />
          </div>
        </div>
      </div>
    );
  }

  const images =
    property.images?.length > 0
      ? property.images
      : ["/images/property-placeholder.jpg"];

  const location = property.location || {};

  return (
    <div className="agent-property-view-page">
      <div className="agent-property-view-topbar">
        <BackLink
          href="/agent/properties"
          label="Back to Assigned Properties"
        />
      </div>

      <div className="agent-property-view-header">
        <div>
          <span className="agent-property-view-eyebrow">Assigned Property</span>

          <h1>{property.title}</h1>

          <p className="agent-property-view-location">
            <FaMapMarkerAlt />
            {location.city || "Location unavailable"}
            {location.subCity ? `, ${location.subCity}` : ""}
          </p>
        </div>

        <span className={`agent-property-view-status ${property.status}`}>
          {formatStatus(property.status)}
        </span>
      </div>

      <div className="agent-property-view-layout">
        <main>
          <section className="agent-property-view-gallery">
            <div className="agent-property-view-main-image">
              <img src={images[activeImage]} alt={property.title} />
            </div>

            {images.length > 1 && (
              <div className="agent-property-view-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={activeImage === index ? "active" : ""}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={image} alt={`${property.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="agent-property-view-section">
            <div className="agent-property-view-section-header">
              <span>Property Overview</span>
              <h2>Property Information</h2>
            </div>

            <div className="agent-property-view-features">
              <div>
                <FaBuilding />
                <span>Property Type</span>
                <strong>{formatStatus(property.propertyType)}</strong>
              </div>

              <div>
                <FaBed />
                <span>Bedrooms</span>
                <strong>{property.bedrooms || "-"}</strong>
              </div>

              <div>
                <FaBath />
                <span>Bathrooms</span>
                <strong>{property.bathrooms || "-"}</strong>
              </div>

              <div>
                <FaRulerCombined />
                <span>Area</span>
                <strong>{property.area ? `${property.area} m²` : "-"}</strong>
              </div>

              <div>
                <FaCar />
                <span>Parking</span>
                <strong>{property.parkingSpace || "-"}</strong>
              </div>

              <div>
                <FaBuilding />
                <span>Floor</span>
                <strong>
                  {property.floorNumber || "-"}
                  {property.totalFloors ? ` / ${property.totalFloors}` : ""}
                </strong>
              </div>
            </div>
          </section>

          <section className="agent-property-view-section">
            <div className="agent-property-view-section-header">
              <span>Description</span>
              <h2>About This Property</h2>
            </div>

            <p className="agent-property-view-description">
              {property.description || "No property description is available."}
            </p>
          </section>

          <section className="agent-property-view-section">
            <div className="agent-property-view-section-header">
              <span>Location</span>
              <h2>Property Location</h2>
            </div>

            <div className="agent-property-view-location-details">
              <div>
                <FaMapMarkerAlt />

                <div>
                  <span>City</span>
                  <strong>{location.city || "-"}</strong>
                </div>
              </div>

              <div>
                <FaMapMarkerAlt />

                <div>
                  <span>Sub City</span>
                  <strong>{location.subCity || "-"}</strong>
                </div>
              </div>

              <div>
                <FaMapMarkerAlt />

                <div>
                  <span>Address</span>
                  <strong>{location.address || "-"}</strong>
                </div>
              </div>
            </div>

            {location.latitude && location.longitude && (
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="agent-property-view-map-link"
              >
                <FaExternalLinkAlt />
                Open Location
              </a>
            )}
          </section>

          {property.virtualTour && (
            <section className="agent-property-view-section">
              <div className="agent-property-view-section-header">
                <span>Virtual Tour</span>
                <h2>Explore Property</h2>
              </div>

              <a
                href={property.virtualTour}
                target="_blank"
                rel="noopener noreferrer"
                className="agent-property-view-tour-link"
              >
                <FaExternalLinkAlt />
                Open Virtual Tour
              </a>
            </section>
          )}
        </main>

        <aside>
          <section className="agent-property-view-price-card">
            <span>Property Price</span>

            <strong>{formatCurrency(property.price, property.currency)}</strong>

            <div className="agent-property-view-price-details">
              <div>
                <span>Payment Type</span>
                <strong>
                  {property.paymentType === "installment"
                    ? "Installment"
                    : "Full Payment"}
                </strong>
              </div>

              <div>
                <span>Listing Status</span>
                <strong>{formatStatus(property.status)}</strong>
              </div>
            </div>
          </section>

          {property.assignedAgent && (
            <section className="agent-property-view-section agent-property-view-contact-section">
              <div className="agent-property-view-section-header">
                <span>Assignment</span>
                <h2>Assigned Agent</h2>
              </div>

              <div className="agent-property-view-person">
                <div className="agent-property-view-person-icon">
                  <FaUser />
                </div>

                <div>
                  <strong>{property.assignedAgent.name || "Agent"}</strong>

                  <span>{property.assignedAgent.email || "-"}</span>
                </div>
              </div>

              {property.assignedAgent.phone && (
                <a
                  href={`tel:${property.assignedAgent.phone}`}
                  className="agent-property-view-contact-link"
                >
                  <FaPhone />
                  {property.assignedAgent.phone}
                </a>
              )}

              {property.assignedAgent.email && (
                <a
                  href={`mailto:${property.assignedAgent.email}`}
                  className="agent-property-view-contact-link"
                >
                  <FaEnvelope />
                  {property.assignedAgent.email}
                </a>
              )}
            </section>
          )}

          {property.owner && (
            <section className="agent-property-view-section">
              <div className="agent-property-view-section-header">
                <span>Ownership</span>
                <h2>Property Owner</h2>
              </div>

              <div className="agent-property-view-person">
                <div className="agent-property-view-person-icon">
                  <FaUser />
                </div>

                <div>
                  <strong>{property.owner.name || "Property Owner"}</strong>

                  {property.owner.email && <span>{property.owner.email}</span>}
                </div>
              </div>

              {property.owner.phone && (
                <a
                  href={`tel:${property.owner.phone}`}
                  className="agent-property-view-contact-link"
                >
                  <FaPhone />
                  {property.owner.phone}
                </a>
              )}

              {property.owner.email && (
                <a
                  href={`mailto:${property.owner.email}`}
                  className="agent-property-view-contact-link"
                >
                  <FaEnvelope />
                  {property.owner.email}
                </a>
              )}
            </section>
          )}

          <section className="agent-property-view-section">
            <div className="agent-property-view-section-header">
              <span>Listing</span>
              <h2>Listing Details</h2>
            </div>

            <div className="agent-property-view-meta">
              <div>
                <span>Created</span>
                <strong>{formatDate(property.createdAt)}</strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>{formatDate(property.updatedAt)}</strong>
              </div>
            </div>
          </section>

          <Link
            href="/agent/appointments"
            className="agent-property-view-appointment-link"
          >
            <FaCalendarAlt />
            <span>Manage Viewing Appointments</span>
            <FaArrowLeft />
          </Link>
        </aside>
      </div>
    </div>
  );
}
