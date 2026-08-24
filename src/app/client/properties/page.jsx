"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import "@/styles/property.css";

import "@/styles/client/properties.css";

import { FaBed, FaBath, FaRulerCombined, FaHeart } from "react-icons/fa";

export default function ClientPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [savedPropertyIds, setSavedPropertyIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 10;

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /*
   * ==========================================
   * FETCH ALL PROPERTIES
   * ==========================================
   *
   * No status filter.
   *
   * Clients can see:
   * available
   * reserved
   * sold
   */
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/properties?page=${currentPage}&limit=${propertiesPerPage}`,
        );

        const data = await response.json();

        if (data.success) {
          setProperties(data.data || []);

          setPagination(
            data.pagination || {
              page: currentPage,
              limit: propertiesPerPage,
              total: data.data?.length || 0,
              totalPages: 1,
            },
          );
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [currentPage]);

  /*
   * ==========================================
   * FETCH CLIENT FAVORITES
   * ==========================================
   */
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const response = await fetch("/api/favorites");

        const data = await response.json();

        if (data.success) {
          setSavedPropertyIds(
            (data.data || [])
              .filter((favorite) => favorite.property)
              .map((favorite) => String(favorite.property._id)),
          );
        }
      } catch (error) {
        console.error("Failed to fetch favorites:", error);
      }
    }

    fetchFavorites();
  }, []);

  /*
   * ==========================================
   * SAVE / REMOVE FAVORITE
   * ==========================================
   */
  async function handleSave(propertyId) {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      const propertyKey = String(propertyId);

      if (data.saved) {
        setSavedPropertyIds((prev) => {
          if (prev.includes(propertyKey)) {
            return prev;
          }

          return [...prev, propertyKey];
        });
      } else {
        setSavedPropertyIds((prev) => prev.filter((id) => id !== propertyKey));
      }
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  }

  if (loading) {
    return <div className="property-loading">Loading properties...</div>;
  }

  return (
    <div className="property-page">
      {/* ==========================================
          PAGE HEADER
          ========================================== */}
      <div className="client-properties-header">
        <div>
          <h1>Properties</h1>

          <p>Browse all available, reserved, and sold properties.</p>
        </div>
      </div>

      {/* ==========================================
          PROPERTY LIST
          ========================================== */}
      {properties.length === 0 ? (
        <div className="empty-properties">
          <p>No properties found.</p>
        </div>
      ) : (
        <>
          <div className="property-list">
            {properties.map((property) => {
              const propertyId = String(property._id);

              const isSaved = savedPropertyIds.includes(propertyId);

              return (
                <div className="property-card" key={property._id}>
                  {/* PROPERTY IMAGE */}
                  <div className="property-image">
                    <img
                      src={
                        property.images && property.images[0]
                          ? property.images[0]
                          : "/images/property-placeholder.jpg"
                      }
                      alt={property.title}
                    />

                    <div className={`status-badge ${property.status}`}>
                      {property.status}
                    </div>

                    {/* CLIENT HEART */}
                    <button
                      type="button"
                      className={`client-property-save-btn ${
                        isSaved ? "saved" : ""
                      }`}
                      onClick={() => handleSave(property._id)}
                      aria-label={
                        isSaved ? "Remove from favorites" : "Save property"
                      }
                    >
                      <FaHeart />
                    </button>
                  </div>

                  {/* PROPERTY TITLE */}
                  <h2>{property.title}</h2>

                  {/* TYPE */}
                  <p>
                    <strong>Type:</strong> {property.propertyType || "-"}
                  </p>

                  {/* PRICE */}
                  <p>
                    <strong>Price:</strong>{" "}
                    {Number(property.price || 0).toLocaleString()}{" "}
                    {property.currency || "ETB"}
                  </p>

                  {/* LOCATION */}
                  <p>
                    <strong>Location:</strong> {property.location?.city || "-"}
                  </p>

                  {/* PROPERTY INFO */}
                  <div className="property-info">
                    <span>
                      <FaBed />
                      {property.bedrooms || "-"}
                    </span>

                    <span>
                      <FaBath />
                      {property.bathrooms || "-"}
                    </span>

                    <span>
                      <FaRulerCombined />
                      {property.area || "-"} m²
                    </span>
                  </div>

                  {/* CLIENT ACTIONS */}
                  <div className="client-property-actions">
                    <Link href={`/client/properties/${property._id}`}>
                      <button className="client-view-property-btn">
                        View Property
                      </button>
                    </Link>

                    <button
                      className="client-save-property-btn"
                      onClick={() => handleSave(property._id)}
                    >
                      <FaHeart />
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==========================================
              PAGINATION
              ========================================== */}
          {pagination.totalPages > 1 && (
            <div className="property-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </button>

              {Array.from(
                {
                  length: pagination.totalPages,
                },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={currentPage === pageNumber ? "active" : ""}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </button>
            </div>
          )}

          <p className="property-pagination-info">
            Showing{" "}
            {pagination.total === 0
              ? 0
              : (currentPage - 1) * propertiesPerPage + 1}{" "}
            - {Math.min(currentPage * propertiesPerPage, pagination.total)} of{" "}
            {pagination.total} properties
          </p>
        </>
      )}
    </div>
  );
}
