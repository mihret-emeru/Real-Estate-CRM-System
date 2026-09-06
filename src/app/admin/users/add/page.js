"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaUserPlus } from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";

import "@/styles/admin/user-form.css";

export default function AdminAddUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    role: "agent",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create user.");
      }

      router.push(`/admin/users/${data.data._id}`);
    } catch (error) {
      console.error("Create user error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to create user.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-user-form-page">
      <div className="admin-user-form-topbar">
        <Link href="/admin/users" className="admin-user-form-back">
          <FaArrowLeft />
          <span>Back to User Management</span>
        </Link>
      </div>

      <div className="admin-user-form-header">
        <div>
          <span className="admin-user-form-eyebrow">Administration</span>

          <h1>Add User</h1>

          <p>Create a new manager or agent account.</p>
        </div>

        <div className="admin-user-form-header-icon">
          <FaUserPlus />
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
                placeholder="Enter full name"
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
                placeholder="Enter email address"
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
                placeholder="Enter phone number"
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
                placeholder="Enter city"
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
                    value: "agent",
                    label: "Agent",
                  },
                  {
                    value: "manager",
                    label: "Manager",
                  },
                ]}
              />
            </div>

            <div className="admin-user-form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>
          </div>
        </section>

        {error && <div className="admin-user-form-error">{error}</div>}

        <div className="admin-user-form-actions">
          <Link href="/admin/users">Cancel</Link>

          <button type="submit" disabled={loading}>
            <FaUserPlus />

            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

