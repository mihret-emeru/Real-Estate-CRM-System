"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  FaArrowLeft,
  FaSave,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
} from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";

import "@/styles/admin/settings-general.css";

const defaultFormData = {
  companyName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  website: "",
  currency: "ETB",
  timezone: "Africa/Addis_Ababa",
};

export default function AdminGeneralSettingsPage() {
  const [formData, setFormData] = useState(defaultFormData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings/general", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load general settings.");
      }

      setFormData({
        companyName: data.data?.companyName || "",
        email: data.data?.email || "",
        phone: data.data?.phone || "",
        address: data.data?.address || "",
        city: data.data?.city || "",
        website: data.data?.website || "",
        currency: data.data?.currency || "ETB",
        timezone: data.data?.timezone || "Africa/Addis_Ababa",
      });
    } catch (error) {
      console.error("Load general settings error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load general settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const response = await fetch("/api/admin/settings/general", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save general settings.");
      }

      setFormData({
        companyName: data.data?.companyName || "",
        email: data.data?.email || "",
        phone: data.data?.phone || "",
        address: data.data?.address || "",
        city: data.data?.city || "",
        website: data.data?.website || "",
        currency: data.data?.currency || "ETB",
        timezone: data.data?.timezone || "Africa/Addis_Ababa",
      });

      setSaved(true);
    } catch (error) {
      console.error("Save general settings error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save general settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-settings-general-page">
        <div className="admin-settings-general-loading">
          Loading general settings...
        </div>
      </div>
    );
  }

  if (error && !formData.companyName) {
    return (
      <div className="admin-settings-general-page">
        <div className="admin-settings-general-error">
          <h2>Unable to load settings</h2>

          <p>{error}</p>

          <button type="button" onClick={fetchSettings}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings-general-page">
      <div className="admin-settings-general-topbar">
        <Link href="/admin/settings" className="admin-settings-general-back">
          <FaArrowLeft />
          <span>Back to System Configuration</span>
        </Link>
      </div>

      <div className="admin-settings-general-header">
        <div>
          <span className="admin-settings-general-eyebrow">
            System Configuration
          </span>

          <h1>General Settings</h1>

          <p>Manage your company information and system-wide defaults.</p>
        </div>

        <div className="admin-settings-general-header-icon">
          <FaBuilding />
        </div>
      </div>

      <form className="admin-settings-general-form" onSubmit={handleSubmit}>
        <section className="admin-settings-general-section">
          <div className="admin-settings-general-section-header">
            <span>Company</span>

            <h2>Company Information</h2>

            <p>Basic information about your real estate business.</p>
          </div>

          <div className="admin-settings-general-grid">
            <div className="admin-settings-general-field full">
              <label htmlFor="companyName">Company Name</label>

              <div className="admin-settings-general-input">
                <FaBuilding />

                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                />
              </div>
            </div>

            <div className="admin-settings-general-field">
              <label htmlFor="email">Email Address</label>

              <div className="admin-settings-general-input">
                <FaEnvelope />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                />
              </div>
            </div>

            <div className="admin-settings-general-field">
              <label htmlFor="phone">Phone Number</label>

              <div className="admin-settings-general-input">
                <FaPhone />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+251 ..."
                />
              </div>
            </div>

            <div className="admin-settings-general-field">
              <label htmlFor="address">Address</label>

              <div className="admin-settings-general-input">
                <FaMapMarkerAlt />

                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                />
              </div>
            </div>

            <div className="admin-settings-general-field">
              <label htmlFor="city">City</label>

              <div className="admin-settings-general-input">
                <FaMapMarkerAlt />

                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                />
              </div>
            </div>

            <div className="admin-settings-general-field full">
              <label htmlFor="website">Website</label>

              <div className="admin-settings-general-input">
                <FaGlobe />

                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="admin-settings-general-section">
          <div className="admin-settings-general-section-header">
            <span>Defaults</span>

            <h2>System Defaults</h2>

            <p>Choose the default settings used throughout the CRM.</p>
          </div>

          <div className="admin-settings-general-grid">
            <div className="admin-settings-general-field">
              <label>Default Currency</label>

              <CustomDropdown
                value={formData.currency}
                onChange={(value) => {
                  setFormData((current) => ({
                    ...current,
                    currency: value,
                  }));

                  setSaved(false);
                  setError("");
                }}
                options={[
                  {
                    value: "ETB",
                    label: "ETB — Ethiopian Birr",
                  },
                  {
                    value: "USD",
                    label: "USD — US Dollar",
                  },
                ]}
              />
            </div>

            <div className="admin-settings-general-field">
              <label>Timezone</label>

              <CustomDropdown
                value={formData.timezone}
                onChange={(value) => {
                  setFormData((current) => ({
                    ...current,
                    timezone: value,
                  }));

                  setSaved(false);
                  setError("");
                }}
                options={[
                  {
                    value: "Africa/Addis_Ababa",
                    label: "Africa/Addis_Ababa",
                  },
                  {
                    value: "Africa/Nairobi",
                    label: "Africa/Nairobi",
                  },
                  {
                    value: "Africa/Cairo",
                    label: "Africa/Cairo",
                  },
                  {
                    value: "UTC",
                    label: "UTC",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="admin-settings-general-error-message">{error}</div>
        )}

        {saved && (
          <div className="admin-settings-general-success">
            Settings saved successfully.
          </div>
        )}

        <div className="admin-settings-general-actions">
          <Link href="/admin/settings">Cancel</Link>

          <button type="submit" disabled={saving}>
            <FaSave />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

