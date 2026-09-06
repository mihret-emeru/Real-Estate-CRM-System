"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  FaArrowLeft,
  FaEdit,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShieldAlt,
} from "react-icons/fa";

import "@/styles/admin/user-view.css";

export default function AdminUserViewPage() {
  const params = useParams();
  const userId = params?.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchUser() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/users/${userId}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load user.");
      }

      setUser(data.data);
    } catch (error) {
      console.error("Admin user view error:", error);

      setError(error instanceof Error ? error.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatRole(role) {
    if (!role) return "-";

    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  if (loading) {
    return (
      <div className="admin-user-view-page">
        <div className="admin-user-view-loading">Loading user...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="admin-user-view-page">
        <div className="admin-user-view-error">
          <FaUser />

          <h2>Unable to load user</h2>

          <p>{error || "The requested user could not be found."}</p>

          <Link href="/admin/users">Back to User Management</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-view-page">
      <div className="admin-user-view-topbar">
        <Link href="/admin/users" className="admin-user-view-back">
          <FaArrowLeft />
          <span>Back to User Management</span>
        </Link>
      </div>

      <div className="admin-user-view-header">
        <div className="admin-user-view-profile">
          <div className="admin-user-view-avatar">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <span className="admin-user-view-eyebrow">User Account</span>

            <h1>{user.name}</h1>

            <p>{user.email}</p>
          </div>
        </div>

        <div className="admin-user-view-header-actions">
          <span
            className={`admin-user-view-status ${
              user.isActive ? "active" : "inactive"
            }`}
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>

          <Link
            href={`/admin/users/${user._id}/edit`}
            className="admin-user-view-edit"
          >
            <FaEdit />
            Edit User
          </Link>
        </div>
      </div>

      <div className="admin-user-view-grid">
        <section className="admin-user-view-section">
          <div className="admin-user-view-section-header">
            <span>Account</span>
            <h2>Account Information</h2>
          </div>

          <div className="admin-user-view-details">
            <div>
              <FaUser />

              <div>
                <span>Full Name</span>
                <strong>{user.name || "-"}</strong>
              </div>
            </div>

            <div>
              <FaEnvelope />

              <div>
                <span>Email</span>
                <strong>{user.email || "-"}</strong>
              </div>
            </div>

            <div>
              <FaPhone />

              <div>
                <span>Phone</span>
                <strong>{user.phone || "-"}</strong>
              </div>
            </div>

            <div>
              <FaMapMarkerAlt />

              <div>
                <span>City</span>
                <strong>{user.city || "-"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-user-view-section">
          <div className="admin-user-view-section-header">
            <span>Access</span>
            <h2>Role & Status</h2>
          </div>

          <div className="admin-user-view-access">
            <div>
              <FaShieldAlt />

              <div>
                <span>Role</span>

                <strong className={`admin-user-view-role ${user.role}`}>
                  {formatRole(user.role)}
                </strong>
              </div>
            </div>

            <div>
              <FaUser />

              <div>
                <span>Account Status</span>

                <strong
                  className={
                    user.isActive
                      ? "admin-user-view-active"
                      : "admin-user-view-inactive"
                  }
                >
                  {user.isActive ? "Active" : "Inactive"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {user.role === "client" && (
          <section className="admin-user-view-section">
            <div className="admin-user-view-section-header">
              <span>Preferences</span>
              <h2>Property Preferences</h2>
            </div>

            <div className="admin-user-view-preferences">
              <div>
                <span>Preferred Property Type</span>
                <strong>{user.preferredPropertyType || "-"}</strong>
              </div>

              <div>
                <span>Minimum Budget</span>
                <strong>
                  {user.minBudget
                    ? `${Number(user.minBudget).toLocaleString()} ${user.currency || "ETB"}`
                    : "-"}
                </strong>
              </div>

              <div>
                <span>Maximum Budget</span>
                <strong>
                  {user.maxBudget
                    ? `${Number(user.maxBudget).toLocaleString()} ${user.currency || "ETB"}`
                    : "-"}
                </strong>
              </div>
            </div>
          </section>
        )}

        <section className="admin-user-view-section">
          <div className="admin-user-view-section-header">
            <span>Account History</span>
            <h2>Account Dates</h2>
          </div>

          <div className="admin-user-view-dates">
            <div>
              <FaCalendarAlt />

              <div>
                <span>Joined</span>
                <strong>{formatDate(user.createdAt)}</strong>
              </div>
            </div>

            <div>
              <FaCalendarAlt />

              <div>
                <span>Last Updated</span>
                <strong>{formatDate(user.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

