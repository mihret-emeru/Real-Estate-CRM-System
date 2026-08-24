"use client";

import { useEffect, useState } from "react";
import ClientPropertyCard from "@/components/client/ClientPropertyCard";

export default function ClientFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFavorites() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/favorites", {
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load favorites.");
      }

      setFavorites(result.data || []);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      setError(error.message || "Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function handleSave(propertyId) {
    try {
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
        alert(result.message || "Failed to update favorite.");
        return;
      }

      /*
       * If the heart is clicked inside Favorites,
       * remove the property from this page immediately.
       */
      if (!result.saved) {
        setFavorites((prev) =>
          prev.filter((favorite) => favorite.property?._id !== propertyId),
        );
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  }

  if (loading) {
    return (
      <div className="client-favorites-page">
        <h1>Favorites</h1>
        <p>Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-favorites-page">
        <h1>Favorites</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="client-favorites-page">
      <div className="client-favorites-header">
        <div>
          <span>YOUR COLLECTION</span>

          <h1>Favorites</h1>

          <p>Properties you saved for later.</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="client-favorites-empty">
          <h2>No favorites yet</h2>

          <p>Save properties you love and they will appear here.</p>
        </div>
      ) : (
        <div className="client-favorites-grid">
          {favorites
            .filter((favorite) => favorite.property && favorite.property._id)
            .map((favorite) => (
              <ClientPropertyCard
                key={favorite._id}
                property={favorite.property}
                isSaved={true}
                onSave={handleSave}
              />
            ))}
        </div>
      )}
    </div>
  );
}
