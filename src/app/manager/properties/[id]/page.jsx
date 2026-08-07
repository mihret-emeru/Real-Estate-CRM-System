"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomDropdown from "@/components/common/CustomDropdown";
import "@/styles/property-details.css";
import dynamic from "next/dynamic";
import {
  FaMoneyBillWave,
  FaHome,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaParking,
  FaMapMarkerAlt,
  FaPhone,
  FaVideo,
  FaCreditCard,
  FaBuilding,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

const PropertyLocationView = dynamic(
  () => import("@/components/properties/PropertyLocationView"),
  {
    ssr: false,
    loading: () => <p>Loading location map...</p>,
  },
);

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assigningAgent, setAssigningAgent] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/properties/${id}`);
        const data = await response.json();

        if (data.success) {
          setProperty(data.data);

          setSelectedAgent(data.data.assignedAgent?._id || "");
        }

        const agentsResponse = await fetch("/api/agents");
        const agentsData = await agentsResponse.json();

        if (agentsData.success) {
          setAgents(agentsData.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProperty();
    }
  }, [id]);

  async function handleAssignAgent() {
    try {
      setAssigningAgent(true);

      const response = await fetch(`/api/properties/${id}/assign-agent`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: selectedAgent || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProperty(data.data);

        alert(
          selectedAgent
            ? "Agent assigned successfully."
            : "Agent unassigned successfully.",
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to assign agent.");
    } finally {
      setAssigningAgent(false);
    }
  }

  async function handleDelete() {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/manager/properties");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading || !property) {
    return (
      <div className="property-details-page">
        <h2>Loading property...</h2>
      </div>
    );
  }

  return (
    <div className="property-details-page">
      <div className="property-details-header">
        <div>
          <h1>{property.title}</h1>

          <p>{property.location.city}</p>
        </div>

        <div className={`property-status ${property.status.replace("_", "-")}`}>
          {property.status}
        </div>
      </div>

      {/* Large Property Image */}
      <div className="property-main-image">
        <img
          src={
            property.images && property.images.length > 0
              ? property.images[0]
              : "/images/property-placeholder.jpg"
          }
          alt={property.title}
        />
      </div>
      <div className="property-info-grid">
        <div className="info-card price-card">
          <span>
            <FaMoneyBillWave className="info-icon" />
            Price
          </span>

          <h3>
            {property.price.toLocaleString()} {property.currency}
          </h3>
        </div>

        <div className="info-card">
          <span>
            <FaHome className="info-icon" />
            Property Type
          </span>
          <h3>
            {property.propertyType.charAt(0).toUpperCase() +
              property.propertyType.slice(1)}
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
      <div className="property-section">
        <h2>Description</h2>

        <p>{property.description || "No description available."}</p>
      </div>

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
      <div className="property-section">
        <h2>
          <FaPhone className="section-icon" />
          Owner Information
        </h2>

        <p>
          <strong>Phone:</strong> {property.ownerPhone || "-"}
        </p>
      </div>

      <div className="property-section">
        <h2>Agent Assignment</h2>

        {property.assignedAgent ? (
          <>
            <p>
              <strong>Name:</strong> {property.assignedAgent.name}
            </p>

            <p>
              <strong>Email:</strong> {property.assignedAgent.email || "-"}
            </p>

            <p>
              <strong>Phone:</strong> {property.assignedAgent.phone || "-"}
            </p>
          </>
        ) : (
          <p>No agent assigned.</p>
        )}
      </div>

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
      <div className="property-actions">
        <Link
          href={`/manager/properties/${property._id}/edit`}
          className="details-edit-btn"
        >
          <FaEdit />
          <span>Edit Property</span>
        </Link>

        <button className="details-delete-btn" onClick={handleDelete}>
          <FaTrash /> Delete Property
        </button>
      </div>
    </div>
  );
}
