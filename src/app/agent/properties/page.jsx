"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaHeart,
  FaMapMarkerAlt,
} from "react-icons/fa";

import "@/styles/agent/assigned-properties.css";

export default function AgentAssignedPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/agent/properties");

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load assigned properties.",
          );
        }

        setProperties(result.data || []);
      } catch (error) {
        console.error("Failed to load assigned properties:", error);

        setError(error.message || "Failed to load assigned properties.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  if (loading) {
    return (
      <div className="agent-assigned-properties-page">
        <div className="agent-assigned-properties-header">
          <span>PROPERTY MANAGEMENT</span>
          <h1>Assigned Properties</h1>
          <p>Properties currently assigned to you.</p>
        </div>

        <div className="agent-properties-state">
          <LoadingSpinner message="Loading assigned properties..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-assigned-properties-page">
        <div className="agent-assigned-properties-header">
          <span>PROPERTY MANAGEMENT</span>
          <h1>Assigned Properties</h1>
          <p>Properties currently assigned to you.</p>
        </div>

        <div className="agent-properties-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-assigned-properties-page">
      <div className="agent-assigned-properties-header">
        <div>
          <span>PROPERTY MANAGEMENT</span>

          <h1>Assigned Properties</h1>

          <p>
            Manage the properties assigned to you and monitor client interest.
          </p>
        </div>

        <div className="agent-assigned-properties-count">
          <strong>{properties.length}</strong>
          <span>Assigned</span>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="agent-properties-state">
          <h2>No properties assigned</h2>

          <p>Properties assigned to you by a manager will appear here.</p>
        </div>
      ) : (
        <div className="agent-assigned-properties-grid">
          {properties.map((property) => (
            <article
              className="agent-assigned-property-card"
              key={property._id}
            >
              <div className="agent-property-image">
                <img
                  src={
                    property.images?.[0] || "/images/property-placeholder.jpg"
                  }
                  alt={property.title}
                />

                <span className={`agent-property-status ${property.status}`}>
                  {property.status}
                </span>

                <div className="agent-property-save-count">
                  <FaHeart />
                  <span>{property.saveCount || 0}</span>
                </div>
              </div>

              <div className="agent-property-content">
                <div className="agent-property-heading">
                  <div>
                    <span className="agent-property-type">
                      {property.propertyType}
                    </span>

                    <h2>{property.title}</h2>
                  </div>
                </div>

                <div className="agent-property-location">
                  <FaMapMarkerAlt />

                  <span>
                    {property.location?.subCity
                      ? `${property.location.subCity}, `
                      : ""}
                    {property.location?.city || "Location unavailable"}
                  </span>
                </div>

                <div className="agent-property-price">
                  {Number(property.price || 0).toLocaleString()}{" "}
                  {property.currency}
                </div>

                <div className="agent-property-details">
                  <span>
                    <FaBed />
                    {property.bedrooms || 0} Beds
                  </span>

                  <span>
                    <FaBath />
                    {property.bathrooms || 0} Baths
                  </span>

                  <span>
                    <FaRulerCombined />
                    {property.area || 0} m²
                  </span>
                </div>

                <div className="agent-property-interest">
                  <div>
                    <FaHeart />

                    <span>
                      <strong>{property.saveCount || 0}</strong> Saves
                    </span>
                  </div>

                  <span>Client interest</span>
                </div>

                <div className="agent-property-actions">
                  <Link
                    href={`/agent/properties/${property._id}`}
                    className="agent-view-property-btn"
                  >
                    View Property
                  </Link>

                  <Link
                    href={`/agent/leads?property=${property._id}`}
                    className="agent-view-interest-btn"
                  >
                    View Interest
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
