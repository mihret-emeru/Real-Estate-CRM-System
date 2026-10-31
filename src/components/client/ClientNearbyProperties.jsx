"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";

import "@/styles/client/nearby-properties.css";

const ClientPropertiesMap = dynamic(
  () => import("@/components/client/ClientPropertiesMap"),
  {
    ssr: false,
    loading: () => (
      <div className="client-map-loading">Loading property map...</div>
    ),
  },
);

export default function ClientNearbyProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);

        const response = await fetch("/api/properties?limit=1000", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load properties.");
        }

        /*
         * The dashboard map shows ALL properties
         * located in Addis Ababa.
         */

        const addisAbabaProperties = (result.data || []).filter((property) => {
          const latitude = Number(property.location?.latitude);

          const longitude = Number(property.location?.longitude);

          return (
            property &&
            property._id &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          );
        });

        setProperties(addisAbabaProperties);
      } catch (error) {
        console.error("Failed to load Addis Ababa properties:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  return (
    <section className="client-nearby-section">
      <div className="client-nearby-header">
        <div>
          <span>PROPERTY DISCOVERY</span>

          <h2>Properties Near You</h2>

          <p>Explore properties available across Addis Ababa.</p>
        </div>

        <Link href="/client/properties/map" className="client-map-search-btn">
          <FaMapMarkerAlt />

          <span>Map Search</span>

          <FaArrowRight />
        </Link>
      </div>

      <div className="client-nearby-map">
        {loading ? (
          <div className="client-map-loading">
            Loading Addis Ababa properties...
          </div>
        ) : properties.length === 0 ? (
          <div className="client-map-empty">
            <FaMapMarkerAlt />

            <h3>No mapped properties yet</h3>

            <p>
              Properties with map locations in Addis Ababa will appear here.
            </p>
          </div>
        ) : (
          <ClientPropertiesMap properties={properties} />
        )}
      </div>
    </section>
  );
}
