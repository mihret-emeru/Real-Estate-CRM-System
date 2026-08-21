"use client";

import Link from "next/link";
import { FaBed, FaBath, FaRulerCombined, FaHeart } from "react-icons/fa";

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

  return (
    <div className="property-card client-property-card">
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

        <div className="property-actions">
          <Link href={`/client/properties/${property._id}`}>
            <button className="view-btn">View Property</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

