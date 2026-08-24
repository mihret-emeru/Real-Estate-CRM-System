"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/property.css";
import CustomDropdown from "@/components/common/CustomDropdown";
import {
  FaPlus,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaFilter,
} from "react-icons/fa";

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const propertiesPerPage = 10;

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch(
          `/api/properties?page=${currentPage}&limit=${propertiesPerPage}${
            statusFilter !== "all" ? `&status=${statusFilter}` : ""
          }`,
        );

        const data = await response.json();

        setProperties(data.data || []);
        setPagination(
          data.pagination || {
            page: currentPage,
            limit: propertiesPerPage,
            total: 0,
            totalPages: 1,
          },
        );
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [currentPage, statusFilter]);

  if (loading) {
    return "Loading properties...";
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setProperties((prev) => prev.filter((property) => property._id !== id));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  return (
    <div>
      <div className="property-header">
        <h1>Property Management</h1>

        <div className="property-header-actions">
          <CustomDropdown
            icon={<FaFilter />}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              {
                value: "all",
                label: "All Properties",
              },
              {
                value: "available",
                label: "Available",
              },
              {
                value: "sold",
                label: "Sold",
              },
              {
                value: "reserved",
                label: "Reserved",
              },
            ]}
          />

          <Link href="/manager/properties/add">
            <button className="add-property-btn">
              <FaPlus />
              <span>Add Property</span>
            </button>
          </Link>
        </div>
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
                <div className={`status-badge ${property.status}`}>
                  {property.status}
                </div>
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

              <div className="property-actions">
                <Link href={`/manager/properties/${property._id}`}>
                  <button className="view-btn">View</button>
                </Link>

                <Link href={`/manager/properties/${property._id}/edit`}>
                  <button className="edit-btn">Edit</button>
                </Link>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(property._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="property-pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            Previous
          </button>

          {Array.from(
            { length: pagination.totalPages },
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
        Showing {(currentPage - 1) * propertiesPerPage + 1} -{" "}
        {Math.min(currentPage * propertiesPerPage, pagination.total)} of{" "}
        {pagination.total} properties
      </p>
    </div>
  );
}
