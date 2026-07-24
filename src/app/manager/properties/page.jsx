"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/property.css";
import { FaPlus } from "react-icons/fa";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties");

        const data = await response.json();

        setProperties(data.data || []);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  if (loading) {
    return <h1>Loading properties...</h1>;
  }

  return (
    <div>
      <div className="property-header">
        <h1>Property Management</h1>

        <Link href="/manager/properties/add">
          <button className="add-property-btn">
            <FaPlus />
            <span>Add Property</span>
          </button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <div className="property-list">
          {properties.map((property) => (
            <div className="property-card" key={property._id}>
              <div className="property-image">
                <img
                  src={
                    property.images && property.images[0]
                      ? property.images[0]
                      : "/images/property-placeholder.jpg"
                  }
                  alt={property.title}
                />
              </div>

              <div className={`status-badge ${property.status}`}>
                {property.status}
              </div>

              <h2>{property.title}</h2>

              <p>
                <strong>Type:</strong> {property.propertyType}
              </p>

              <p>
                <strong>Price:</strong> {property.price.toLocaleString()}{" "}
                {property.currency}
              </p>

              <p>
                <strong>Location:</strong> {property.location.city}
              </p>

              <div className="property-info">
                <span>🛏 {property.bedrooms}</span>

                <span>🛁 {property.bathrooms}</span>

                <span>📐 {property.area} m²</span>
              </div>

              <div className="property-actions">
                <button className="view-btn">View</button>

                <button className="edit-btn">Edit</button>

                <button className="delete-btn">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
