"use client";

import { useEffect, useState } from "react";
import ClientPropertyCard from "./ClientPropertyCard";

export default function ClientPropertySection() {
  const [properties, setProperties] = useState([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // Load available properties
        const response = await fetch("/api/recommendations");

        const propertiesResult = await response.json();

        if (!response.ok || !propertiesResult.success) {
          throw new Error(
            propertiesResult.message || "Failed to load properties.",
          );
        }

        const validProperties = (propertiesResult.data || []).filter(
          (property) => property && property._id,
        );

        setProperties(validProperties);

        // Load current client's favorites
        const favoritesResponse = await fetch("/api/favorites", {
          credentials: "include",
        });

        const favoritesResult = await favoritesResponse.json();

        if (favoritesResponse.ok && favoritesResult.success) {
          const ids = (favoritesResult.data || [])
            .map((favorite) => favorite.property?._id)
            .filter(Boolean);

          setSavedPropertyIds(ids);
        }
      } catch (error) {
        console.error("Failed to load client home data:", error);

        setError(error.message || "Failed to load properties.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSave(propertyId) {
    try {
      const sessionResponse = await fetch("/api/auth/session", {
        credentials: "include",
      });

      const sessionData = await sessionResponse.json();

      console.log("SESSION BEFORE FAVORITE:", sessionData);
      const response = await fetch("/api/favorites", {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          propertyId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Favorite error:", result);

        alert(result.message || "Failed to update favorite.");

        return;
      }

      if (result.saved) {
        setSavedPropertyIds((prev) => {
          if (prev.includes(propertyId)) {
            return prev;
          }

          return [...prev, propertyId];
        });
      } else {
        setSavedPropertyIds((prev) => prev.filter((id) => id !== propertyId));
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);

      alert("Failed to update favorite.");
    }
  }

  if (loading) {
    return (
      <section className="client-properties-section">
        <h2>Recommended Properties</h2>

        <p>Loading properties...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="client-properties-section">
        <h2>Recommended Properties</h2>

        <p>{error}</p>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="client-properties-section">
        <h2>Recommended Properties</h2>

        <p>No available properties are currently listed.</p>
      </section>
    );
  }

  return (
    <section className="client-properties-section">
      <div className="client-properties-header">
        <div>
          <span>EXPLORE</span>

          <h2>Recommended Properties</h2>

          <p>Properties available for purchase.</p>
        </div>
      </div>

      <div className="client-properties-grid">
        {properties.map((property) => (
          <ClientPropertyCard
            key={property._id}
            property={property}
            isSaved={savedPropertyIds.includes(property._id)}
            onSave={handleSave}
          />
        ))}
      </div>
    </section>
  );
}

