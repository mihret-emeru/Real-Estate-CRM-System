"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import CustomDropdown from "@/components/common/CustomDropdown";

export default function ClientHero() {
  const [propertyType, setPropertyType] = useState("all");
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    e.preventDefault();

    const searchData = {
      city: "Addis Ababa",
      propertyType,
      search,
    };

    console.log("Property search:", searchData);
  }

  return (
    <section className="client-hero">
      <div className="client-hero-content">
        <span className="client-hero-eyebrow">FIND YOUR NEXT HOME</span>

        <h1>Find a home you'll love.</h1>

        <p>
          Discover properties in Addis Ababa that match your preferences and
          lifestyle.
        </p>
      </div>

      <form className="client-property-search" onSubmit={handleSearch}>
        {/* Search */}
        <div className="client-search-input">
          <FaSearch />

          <input
            type="text"
            placeholder="Search properties or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="client-location">
          <FaMapMarkerAlt />

          <span>Addis Ababa</span>
        </div>

        {/* Property Type */}
        <div className="client-type-dropdown">
          <CustomDropdown
            value={propertyType}
            onChange={setPropertyType}
            options={[
              {
                value: "all",
                label: "All Types",
              },

              {
                value: "villa",
                label: "Villa",
              },
              {
                value: "apartment",
                label: "Apartment",
              },
              {
                value: "commercial",
                label: "Commercial",
              },
            ]}
          />
        </div>
      </form>
    </section>
  );
}
