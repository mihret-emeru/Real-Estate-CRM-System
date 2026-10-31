"use client";

import Link from "next/link";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";

import ClientMapSearch from "@/components/client/ClientMapSearch";

import "@/styles/client/map-search.css";

export default function ClientMapSearchPage() {
  return (
    <div className="client-map-search-page">
      {/* Header */}
      <div className="client-map-search-header">
        <Link href="/client/dashboard" className="client-map-search-back">
          <FaArrowLeft />
          Back to Dashboard
        </Link>

        <div className="client-map-search-heading">
          <span>PROPERTY DISCOVERY</span>

          <h1>Map Search</h1>

          <p>
            Explore available properties across Addis Ababa and find a location
            that works for you.
          </p>
        </div>
      </div>

      {/* Map Search */}
      <section className="client-map-search-section">
        <div className="client-map-search-section-header">
          <div>
            <FaMapMarkerAlt />

            <div>
              <h2>Explore Properties</h2>

              <p>Browse properties by location on the map.</p>
            </div>
          </div>
        </div>

        <ClientMapSearch />
      </section>
    </div>
  );
}
