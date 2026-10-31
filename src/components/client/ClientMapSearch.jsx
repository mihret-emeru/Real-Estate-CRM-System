"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import dynamic from "next/dynamic";

const ClientPropertiesMap = dynamic(
  () => import("@/components/client/ClientPropertiesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="client-map-search-loading">Loading property map...</div>
    ),
  },
);

export default function ClientMapSearch() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/properties?limit=1000", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load properties.");
        }

        /*
         * The map displays all properties that have
         * valid coordinates.
         *
         * The map itself is restricted to Addis Ababa.
         */
        const mappedProperties = (result.data || []).filter((property) => {
          const latitude = Number(property.location?.latitude);

          const longitude = Number(property.location?.longitude);

          return (
            property &&
            property._id &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          );
        });

        setProperties(mappedProperties);
      } catch (error) {
        console.error("Failed to load map properties:", error);

        setError(error.message || "Failed to load properties.");
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  if (loading) {
    return (
      <div className="client-map-search-loading">Loading properties...</div>
    );
  }

  if (error) {
    return (
      <div className="client-map-search-error">
        <p>{error}</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="client-map-search-empty">
        <p>No properties with map locations are currently available.</p>
      </div>
    );
  }

  const filteredProperties = properties.filter((property) => {
    const query = locationSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const city = String(property.location?.city || "").toLowerCase();
    const subCity = String(property.location?.subCity || "").toLowerCase();
    const address = String(property.location?.address || "").toLowerCase();

    return (
      city.includes(query) || subCity.includes(query) || address.includes(query)
    );
  });

  return (
    <div className="client-map-search-map-container">
      <div className="client-map-location-search">
        <FaSearch />

        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Search by location, e.g. Bole..."
        />
      </div>

      <ClientPropertiesMap properties={filteredProperties} />
    </div>
  );
}
