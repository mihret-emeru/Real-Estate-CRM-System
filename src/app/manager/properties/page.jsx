"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
      <h1>Property Management</h1>
      <Link href="/manager/properties/add">
        <button>Add Property</button>
      </Link>

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <div>
          {properties.map((property) => (
            <div key={property._id}>
              <h3>{property.title}</h3>

              <p>Type: {property.propertyType}</p>

              <p>
                Price: {property.price} {property.currency}
              </p>

              <p>Location: {property.location.city}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

