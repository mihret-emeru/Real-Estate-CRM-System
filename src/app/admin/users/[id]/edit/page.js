"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { FaArrowLeft, FaSave, FaUserEdit } from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";

import "@/styles/admin/user-form.css";

export default function AdminEditUserPage() {
  const params = useParams();
  const router = useRouter();

  const userId = params?.id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    preferredPropertyType: "other",
    minBudget: "",
    maxBudget: "",
    currency: "ETB",
    role: "client",
    profileImage: "",
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      const user = data.data;

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        preferredPropertyType: user.preferredPropertyType || "other",
        minBudget:
          user.minBudget !== undefined && user.minBudget !== null
            ? String(user.minBudget)
            : "",
        maxBudget:
          user.maxBudget !== undefined && user.maxBudget !== null
            ? String(user.maxBudget)
            : "",
        currency: user.currency || "ETB",
        role: user.role || "client",
        profileImage: user.profileImage || "",
        isActive: Boolean(user.isActive),
      });
    } catch (error) {
      console.error("Load user edit error:", error);

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

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          minBudget:
            formData.minBudget === "" ? undefined : Number(formData.minBudget),
          maxBudget:
            formData.maxBudget === "" ? undefined : Number(formData.maxBudget),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update user.");
      }

      router.push(`/admin/users/${userId}`);
    } catch (error) {
      console.error("Update user error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update user.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-user-form-page">
        <div className="admin-user-form-loading">Loading user...</div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="admin-user-form-page">
        <div className="admin-user-form-error-state">
          <h2>Unable to load user</h2>
          <p>{error}</p>

          <Link href="/admin/users">Back to User Management</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-form-page">
      <div className="admin-user-form-topbar">
        <Link href={`/admin/users/${userId}`} className="admin-user-form-back">
          <FaArrowLeft />
          <span>Back to User</span>
        </Link>
      </div>

      <div className="admin-user-form-header">
        <div>
          <span className="admin-user-form-eyebrow">Administration</span>

          <h1>Edit User</h1>

          <p>Update account information, role, and access.</p>
        </div>

        <div className="admin-user-form-header-icon">
          <FaUserEdit />
        </div>
      </div>

      <form className="admin-user-form" onSubmit={handleSubmit}>
        <section className="admin-user-form-section">
          <div className="admin-user-form-section-header">
            <span>Account Information</span>
            <h2>Basic Details</h2>
          </div>

          <div className="admin-user-form-grid">
            <div className="admin-user-form-field">
              <label htmlFor="name">Full Name</label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="phone">Phone</label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="city">City</label>

              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="admin-user-form-field">
              <label>Role</label>

              <CustomDropdown
                value={formData.role}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    role: value,
                  }))
                }
                options={[
                  {
                    value: "admin",
                    label: "Admin",
                  },
                  {
                    value: "manager",
                    label: "Manager",
                  },
                  {
                    value: "agent",
                    label: "Agent",
                  },
                  {
                    value: "client",
                    label: "Client",
                  },
                ]}
              />
            </div>

            <div className="admin-user-form-field">
              <label>Currency</label>

              <CustomDropdown
                value={formData.currency}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    currency: value,
                  }))
                }
                options={[
                  {
                    value: "ETB",
                    label: "ETB",
                  },
                  {
                    value: "USD",
                    label: "USD",
                  },
                ]}
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="minBudget">Minimum Budget</label>

              <input
                id="minBudget"
                name="minBudget"
                type="number"
                min="0"
                value={formData.minBudget}
                onChange={handleChange}
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="maxBudget">Maximum Budget</label>

              <input
                id="maxBudget"
                name="maxBudget"
                type="number"
                min="0"
                value={formData.maxBudget}
                onChange={handleChange}
              />
            </div>

            <div className="admin-user-form-field">
              <label>Preferred Property Type</label>

              <CustomDropdown
                value={formData.preferredPropertyType}
                onChange={(value) =>
                  setFormData((current) => ({
                    ...current,
                    preferredPropertyType: value,
                  }))
                }
                options={[
                  {
                    value: "house",
                    label: "House",
                  },
                  {
                    value: "apartment",
                    label: "Apartment",
                  },
                  {
                    value: "villa",
                    label: "Villa",
                  },
                  {
                    value: "land",
                    label: "Land",
                  },
                  {
                    value: "commercial",
                    label: "Commercial",
                  },
                  {
                    value: "other",
                    label: "Other",
                  },
                ]}
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="profileImage">Profile Image URL</label>

              <input
                id="profileImage"
                name="profileImage"
                type="url"
                value={formData.profileImage}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        <section className="admin-user-form-section">
          <div className="admin-user-form-section-header">
            <span>Access Control</span>
            <h2>Account Status</h2>
          </div>

          <label className="admin-user-form-checkbox">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />

            <span>Account is active</span>
          </label>
        </section>

        {error && <div className="admin-user-form-error">{error}</div>}

        <div className="admin-user-form-actions">
          <Link href={`/admin/users/${userId}`}>Cancel</Link>

          <button type="submit" disabled={saving}>
            <FaSave />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

