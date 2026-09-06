"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/admin/settings-properties.css";
import CustomDropdown from "@/components/common/CustomDropdown";

import {
  FaArrowLeft,
  FaBuilding,
  FaImage,
  FaCog,
  FaSlidersH,
  FaLightbulb,
} from "react-icons/fa";

export default function PropertySettingsPage() {
  const [settings, setSettings] = useState({
    propertyManagementEnabled: true,
    allowNewListings: true,
    requireImages: true,
    minimumImages: 1,
    defaultStatus: "available",
    defaultCurrency: "ETB",
    defaultPropertyType: "apartment",
    allowEditing: true,
    allowDeletion: true,
    requireDescription: true,
    requireLocation: true,
    recommendationsEnabled: true,
    virtualToursEnabled: true,
    favoritesEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings/properties");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load property settings");
      }

      setSettings(data.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setSettings((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));

    setMessage("");
    setError("");
  }

  function handleDropdownChange(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSave(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/settings/properties", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save property settings");
      }

      setSettings(data.data);
      setMessage("Property settings saved successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    fetchSettings();
    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <div className="property-settings-loading">
        <div className="property-settings-loading-spinner" />
        <p>Loading property settings...</p>
      </div>
    );
  }

  return (
    <div className="property-settings-page">
      <div className="property-settings-header">
        <div className="property-settings-heading">
          <Link href="/admin/settings" className="property-settings-back">
            <FaArrowLeft />
            <span>System Configuration</span>
          </Link>

          <div className="property-settings-title">
            <div className="property-settings-title-icon">
              <FaBuilding />
            </div>

            <div>
              <h1>Property Settings</h1>

              <p>
                Configure property listings, defaults, rules, and available
                features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="property-settings-alert success">{message}</div>
      )}

      {error && <div className="property-settings-alert error">{error}</div>}

      <form className="property-settings-form" onSubmit={handleSave}>
        <section className="property-settings-card">
          <div className="property-settings-card-header">
            <div className="property-settings-card-icon">
              <FaBuilding />
            </div>

            <div>
              <h2>Property Listings</h2>
              <p>Control how property listings are created and managed.</p>
            </div>
          </div>

          <div className="property-settings-options">
            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Enable Property Management</strong>

                <span>Allow the CRM to manage property listings.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="propertyManagementEnabled"
                checked={settings.propertyManagementEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Allow New Property Listings</strong>

                <span>Allow managers to create new property listings.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="allowNewListings"
                checked={settings.allowNewListings}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Require Property Images</strong>

                <span>Require images when creating a property.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="requireImages"
                checked={settings.requireImages}
                onChange={handleChange}
              />
            </label>

            <div className="property-setting-input-row">
              <div className="property-setting-content">
                <strong>Minimum Images per Property</strong>

                <span>Minimum number of images required for each listing.</span>
              </div>

              <input
                className="property-number-input"
                type="number"
                name="minimumImages"
                min="1"
                max="10"
                value={settings.minimumImages}
                onChange={handleChange}
                disabled={!settings.requireImages}
              />
            </div>
          </div>
        </section>

        <section className="property-settings-card">
          <div className="property-settings-card-header">
            <div className="property-settings-card-icon">
              <FaSlidersH />
            </div>

            <div>
              <h2>Property Defaults</h2>
              <p>
                Define the default values used when creating new properties.
              </p>
            </div>
          </div>

          <div className="property-settings-defaults-grid">
            <div className="property-setting-field">
              <label>Default Property Status</label>

              <CustomDropdown
                value={settings.defaultStatus}
                onChange={(value) =>
                  handleDropdownChange("defaultStatus", value)
                }
                options={[
                  {
                    value: "available",
                    label: "Available",
                  },
                  {
                    value: "pending",
                    label: "Pending",
                  },
                  {
                    value: "sold",
                    label: "Sold",
                  },
                  {
                    value: "rented",
                    label: "Rented",
                  },
                ]}
              />
            </div>

            <div className="property-setting-field">
              <label>Default Property Currency</label>

              <CustomDropdown
                value={settings.defaultCurrency}
                onChange={(value) =>
                  handleDropdownChange("defaultCurrency", value)
                }
                options={[
                  {
                    value: "ETB",
                    label: "Ethiopian Birr (ETB)",
                  },
                  {
                    value: "USD",
                    label: "US Dollar (USD)",
                  },
                ]}
              />
            </div>

            <div className="property-setting-field">
              <label>Default Property Type</label>

              <CustomDropdown
                value={settings.defaultPropertyType}
                onChange={(value) =>
                  handleDropdownChange("defaultPropertyType", value)
                }
                options={[
                  {
                    value: "apartment",
                    label: "Apartment",
                  },
                  {
                    value: "villa",
                    label: "Villa",
                  },
                  {
                    value: "house",
                    label: "House",
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
          </div>
        </section>

        <section className="property-settings-card">
          <div className="property-settings-card-header">
            <div className="property-settings-card-icon">
              <FaCog />
            </div>

            <div>
              <h2>Property Rules</h2>
              <p>
                Control editing, deletion, and required property information.
              </p>
            </div>
          </div>

          <div className="property-settings-options">
            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Allow Property Editing</strong>

                <span>
                  Allow authorized users to edit property information.
                </span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="allowEditing"
                checked={settings.allowEditing}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Allow Property Deletion</strong>

                <span>Allow authorized users to delete property listings.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="allowDeletion"
                checked={settings.allowDeletion}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Require Property Description</strong>

                <span>Require a description when creating a property.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="requireDescription"
                checked={settings.requireDescription}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Require Property Location</strong>

                <span>Require location information for every property.</span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="requireLocation"
                checked={settings.requireLocation}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="property-settings-card">
          <div className="property-settings-card-header">
            <div className="property-settings-card-icon">
              <FaLightbulb />
            </div>

            <div>
              <h2>Property Features</h2>
              <p>
                Enable optional features available to clients and property
                users.
              </p>
            </div>
          </div>

          <div className="property-settings-options">
            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Enable Property Recommendations</strong>

                <span>
                  Allow the CRM recommendation system to suggest suitable
                  properties.
                </span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="recommendationsEnabled"
                checked={settings.recommendationsEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Enable Virtual Tours</strong>

                <span>
                  Allow properties to include virtual tour experiences.
                </span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="virtualToursEnabled"
                checked={settings.virtualToursEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="property-setting-row">
              <div className="property-setting-content">
                <strong>Enable Property Favorites</strong>

                <span>
                  Allow clients to save properties to their favorites.
                </span>
              </div>

              <input
                className="property-setting-toggle"
                type="checkbox"
                name="favoritesEnabled"
                checked={settings.favoritesEnabled}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <div className="property-settings-actions">
          <button
            type="button"
            className="property-settings-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="property-settings-save"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

