"use client";

import Link from "next/link";

import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaHeart,
  FaComments,
} from "react-icons/fa";

export default function ClientPropertyCard({
  property,
  isSaved = false,
  onSave,
}) {
  if (!property || !property._id) {
    return null;
  }

  const image = property.images?.[0] || "/images/property-placeholder.jpg";

  const city = property.location?.city || "Addis Ababa";

  const status = property.status || "available";

  // ============================================================
  // MESSAGE AGENT
  // ============================================================

  async function handleMessageAgent() {
    if (!property.assignedAgent) {
      return;
    }

    try {
      const response = await fetch("/api/client/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId: property._id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || "Unable to open conversation.");
        return;
      }

      const conversationId = data.data?._id;

      if (!conversationId) {
        alert("Conversation could not be opened.");
        return;
      }

      window.location.href = `/client/messages/${conversationId}`;
    } catch (error) {
      console.error("Failed to open conversation:", error);

      alert("Unable to connect with the agent. Please try again.");
    }
  }

  return (
    <div className="property-card client-property-card">
      {/* ======================================================
          PROPERTY IMAGE
          ====================================================== */}

      <div className="property-image">
        <img src={image} alt={property.title || "Property"} />

        {/* Property Status */}
        <div className={`status-badge ${status}`}>{status}</div>

        {/* Save / Favorite */}
        <button
          type="button"
          className={`property-save-btn ${isSaved ? "saved" : ""}`}
          onClick={() => onSave?.(property._id)}
          aria-label={isSaved ? "Remove from favorites" : "Save property"}
        >
          <FaHeart />
        </button>
      </div>

      {/* ======================================================
          PROPERTY CONTENT
          ====================================================== */}

      <div className="property-card-content">
        <h2>{property.title || "Untitled Property"}</h2>

        <p>
          <strong>Type:</strong> {property.propertyType || "-"}
        </p>

        <p>
          <strong>Price:</strong> {Number(property.price || 0).toLocaleString()}{" "}
          {property.currency || "ETB"}
        </p>

        <p>
          <strong>Location:</strong> {city}
        </p>

        {/* ====================================================
            PROPERTY INFORMATION
            ==================================================== */}

        <div className="property-info">
          <span>
            <FaBed />
            {property.bedrooms || "-"}
          </span>

          <span>
            <FaBath />
            {property.bathrooms || "-"}
          </span>

          <span>
            <FaRulerCombined />
            {property.area || "-"} m²
          </span>
        </div>

        {/* ====================================================
            CLIENT ACTIONS
            ==================================================== */}

        <div className="property-actions client-card-actions">
          <Link
            href={`/client/properties/${property._id}`}
            className="client-view-property-btn"
          >
            View Property
          </Link>

          {property.assignedAgent ? (
            <button
              type="button"
              className="client-message-agent-btn"
              onClick={handleMessageAgent}
            >
              <FaComments />
              Message Agent
            </button>
          ) : (
            <button
              type="button"
              className="client-message-agent-btn disabled"
              disabled
            >
              <FaComments />
              Agent Not Assigned
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
