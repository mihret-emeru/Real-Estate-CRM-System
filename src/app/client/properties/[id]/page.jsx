"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

import "@/styles/property-details.css";

import {
  FaMoneyBillWave,
  FaHome,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaParking,
  FaMapMarkerAlt,
  FaVideo,
  FaCreditCard,
  FaBuilding,
  FaHeart,
} from "react-icons/fa";

const PropertyLocationView = dynamic(
  () => import("@/components/properties/PropertyLocationView"),
  {
    ssr: false,
    loading: () => <p>Loading location map...</p>,
  },
);

export default function ClientPropertyDetailsPage() {
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/properties/${id}`);
        const data = await response.json();

        if (data.success) {
          setProperty(data.data);

          // Record this property view for recommendations
          try {
            await fetch("/api/property-interactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                propertyId: data.data._id,
              }),
            });
          } catch (interactionError) {
            console.error("Failed to record property view:", interactionError);
          }
        }
      } catch (error) {
        console.error("Failed to fetch property:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProperty();
    }
  }, [id]);

  async function handleSave() {
    try {
      // Temporary frontend state until the favorites API is connected.
      setSaved((current) => !current);

      /*
       * Later this can be replaced with:
       *
       * await fetch("/api/favorites", {
       *   method: saved ? "DELETE" : "POST",
       *   headers: {
       *     "Content-Type": "application/json",
       *   },
       *   body: JSON.stringify({
       *     propertyId: property._id,
       *   }),
       * });
       */
    } catch (error) {
      console.error("Failed to save property:", error);
    }
  }

  if (loading) {
    return (
      <div className="property-details-page">
        <h2>Loading property...</h2>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-details-page">
        <h2>Property not found.</h2>

        <Link href="/client/dashboard" className="property-back-link">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const image =
    property.images && property.images.length > 0
      ? property.images[0]
      : "/images/property-placeholder.jpg";

  const city = property.location?.city || "-";

  return (
    <div className="property-details-page">
      <Link href="/client/dashboard" className="property-back-link">
        ← Back to Properties
      </Link>

      <div className="property-details-header">
        <div>
          <h1>{property.title}</h1>

          <p>{city}</p>
        </div>
      </div>

      {/* Main Property Image */}
      <div className="property-main-image">
        <img src={image} alt={property.title || "Property"} />
      </div>

      {/* Property Information */}
      <div className="property-info-grid">
        <div className="info-card price-card">
          <span>
            <FaMoneyBillWave className="info-icon" />
            Price
          </span>

          <h3>
            {Number(property.price || 0).toLocaleString()}{" "}
            {property.currency || "ETB"}
          </h3>
        </div>

        <div className="info-card">
          <span>
            <FaHome className="info-icon" />
            Property Type
          </span>

          <h3>
            {property.propertyType
              ? property.propertyType.charAt(0).toUpperCase() +
                property.propertyType.slice(1)
              : "-"}
          </h3>
        </div>

        <div className="info-card">
          <span>
            <FaBuilding className="info-icon" />
            Floor
          </span>

          <h3>{property.floorNumber || "-"}</h3>
        </div>

        <div className="info-card">
          <span>
            <FaCreditCard className="info-icon" />
            Payment
          </span>

          <h3>
            {property.paymentType === "full_payment"
              ? "Full Payment"
              : "Installment"}
          </h3>
        </div>

        <div className="info-card">
          <span>
            <FaBed className="info-icon" />
            Bedrooms
          </span>

          <h3>{property.bedrooms || "-"}</h3>
        </div>

        <div className="info-card">
          <span>
            <FaBath className="info-icon" />
            Bathrooms
          </span>

          <h3>{property.bathrooms || "-"}</h3>
        </div>

        <div className="info-card">
          <span>
            <FaRulerCombined className="info-icon" />
            Net Area
          </span>

          <h3>{property.area || "-"} m²</h3>
        </div>

        <div className="info-card">
          <span>
            <FaParking className="info-icon" />
            Parking
          </span>

          <h3>{property.parkingSpace ? "Yes" : "No"}</h3>
        </div>
      </div>

      {/* Description */}
      <div className="property-section">
        <h2>Description</h2>

        <p>{property.description || "No description available."}</p>
      </div>

      {/* Location */}
      <div className="property-section">
        <h2>
          <FaMapMarkerAlt className="section-icon" />
          Location
        </h2>

        <p>
          <strong>City:</strong> {property.location?.city || "-"}
        </p>

        <p>
          <strong>Sub City:</strong> {property.location?.subCity || "-"}
        </p>

        <p>
          <strong>Address:</strong> {property.location?.address || "-"}
        </p>

        <PropertyLocationView
          latitude={property.location?.latitude}
          longitude={property.location?.longitude}
        />
      </div>

      {/* Virtual Tour */}
      {property.virtualTour && (
        <div className="property-section">
          <h2>
            <FaVideo className="section-icon" />
            Virtual Tour
          </h2>

          <a
            href={property.virtualTour}
            target="_blank"
            rel="noopener noreferrer"
            className="tour-btn"
          >
            Open Virtual Tour
          </a>
        </div>
      )}
    </div>
  );
}
