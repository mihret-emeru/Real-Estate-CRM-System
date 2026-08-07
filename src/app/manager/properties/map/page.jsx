"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PropertyMap = dynamic(
  () => import("@/components/properties/PropertyMap"),
  {
    ssr: false,
    loading: () => <p>Loading map...</p>,
  },
);

export default function PropertyMapPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/api/properties");

        const data = await response.json();

        if (data.success) {
          setProperties(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  if (loading) {
    return <p>Loading property map...</p>;
  }

  const mappedProperties = properties.filter(
    (property) =>
      property.location?.latitude != null &&
      property.location?.longitude != null,
  );

  return (
    <div className="property-map-page">
      <div className="page-title">
        <h1>Property Map</h1>

        <p>View all properties by location.</p>
      </div>

      <div className="property-map-summary">
        <span>{mappedProperties.length} properties on map</span>

        <span>
          {properties.length - mappedProperties.length} without coordinates
        </span>
      </div>

      <PropertyMap properties={mappedProperties} />
    </div>
  );
}

