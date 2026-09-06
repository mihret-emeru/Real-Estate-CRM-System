"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/admin/settings-preferences.css";
import CustomDropdown from "@/components/common/CustomDropdown";

import {
  FaArrowLeft,
  FaDesktop,
  FaClock,
  FaBell,
  FaChartBar,
  FaDatabase,
} from "react-icons/fa";

const defaultPreferences = {
  theme: "system",
  sidebarCollapsed: false,
  compactMode: false,
  showBreadcrumbs: true,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24-hour",
  weekStartsOn: "monday",
  systemNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  notificationSoundEnabled: true,
  showStatisticsCards: true,
  showRecentActivity: true,
  showQuickActions: true,
  recordsPerPage: 10,
  confirmBeforeDelete: true,
  autoRefreshData: true,
  autoRefreshInterval: 60,
};

export default function PreferencesSettingsPage() {
  const [settings, setSettings] = useState(defaultPreferences);
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

      const response = await fetch("/api/admin/settings/preferences");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load system preferences");
      }

      setSettings({
        ...defaultPreferences,
        ...(data.data || {}),
      });
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

      const response = await fetch("/api/admin/settings/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save system preferences");
      }

      setSettings({
        ...defaultPreferences,
        ...(data.data || {}),
      });

      setMessage("System preferences saved successfully.");
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
      <div className="preferences-settings-loading">
        <div className="preferences-settings-loading-spinner" />

        <p>Loading system preferences...</p>
      </div>
    );
  }

  return (
    <div className="preferences-settings-page">
      <div className="preferences-settings-header">
        <div className="preferences-settings-heading">
          <Link href="/admin/settings" className="preferences-settings-back">
            <FaArrowLeft />
            <span>System Configuration</span>
          </Link>

          <div className="preferences-settings-title">
            <div>
              <h1>System Preferences</h1>

              <p>
                Configure interface, date and time, notifications, dashboard,
                and data behavior.
              </p>
            </div>

            <div className="preferences-settings-title-icon">
              <FaDesktop />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="preferences-settings-alert success">{message}</div>
      )}

      {error && <div className="preferences-settings-alert error">{error}</div>}

      <form className="preferences-settings-form" onSubmit={handleSave}>
        <section className="preferences-settings-card">
          <div className="preferences-settings-card-header">
            <div className="preferences-settings-card-icon">
              <FaDesktop />
            </div>

            <div>
              <h2>Display & Interface</h2>

              <p>Customize how the CRM interface behaves and appears.</p>
            </div>
          </div>

          <div className="preferences-settings-options">
            <div className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Default Theme</strong>

                <span>
                  Choose the default appearance for the CRM interface.
                </span>
              </div>

              <div className="preferences-setting-control">
                <CustomDropdown
                  value={settings.theme}
                  onChange={(value) => handleDropdownChange("theme", value)}
                  options={[
                    {
                      value: "system",
                      label: "System Default",
                    },
                    {
                      value: "light",
                      label: "Light",
                    },
                    {
                      value: "dark",
                      label: "Dark",
                    },
                  ]}
                />
              </div>
            </div>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Sidebar Collapsed by Default</strong>

                <span>Start the CRM with the sidebar collapsed.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="sidebarCollapsed"
                checked={settings.sidebarCollapsed}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Compact Mode</strong>

                <span>
                  Reduce spacing and make interface elements more compact.
                </span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="compactMode"
                checked={settings.compactMode}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Show Breadcrumbs</strong>

                <span>Display navigation breadcrumbs on supported pages.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="showBreadcrumbs"
                checked={settings.showBreadcrumbs}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="preferences-settings-card">
          <div className="preferences-settings-card-header">
            <div className="preferences-settings-card-icon">
              <FaClock />
            </div>

            <div>
              <h2>Date & Time</h2>

              <p>Define how dates, times, and weeks are displayed.</p>
            </div>
          </div>

          <div className="preferences-settings-options">
            <div className="preferences-settings-grid">
              <div className="preferences-setting-field">
                <label>Date Format</label>

                <CustomDropdown
                  value={settings.dateFormat}
                  onChange={(value) =>
                    handleDropdownChange("dateFormat", value)
                  }
                  options={[
                    {
                      value: "DD/MM/YYYY",
                      label: "DD/MM/YYYY",
                    },
                    {
                      value: "MM/DD/YYYY",
                      label: "MM/DD/YYYY",
                    },
                    {
                      value: "YYYY-MM-DD",
                      label: "YYYY-MM-DD",
                    },
                  ]}
                />
              </div>

              <div className="preferences-setting-field">
                <label>Time Format</label>

                <CustomDropdown
                  value={settings.timeFormat}
                  onChange={(value) =>
                    handleDropdownChange("timeFormat", value)
                  }
                  options={[
                    {
                      value: "24-hour",
                      label: "24-hour",
                    },
                    {
                      value: "12-hour",
                      label: "12-hour",
                    },
                  ]}
                />
              </div>

              <div className="preferences-setting-field">
                <label>Week Starts On</label>

                <CustomDropdown
                  value={settings.weekStartsOn}
                  onChange={(value) =>
                    handleDropdownChange("weekStartsOn", value)
                  }
                  options={[
                    {
                      value: "monday",
                      label: "Monday",
                    },
                    {
                      value: "sunday",
                      label: "Sunday",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="preferences-settings-card">
          <div className="preferences-settings-card-header">
            <div className="preferences-settings-card-icon">
              <FaBell />
            </div>

            <div>
              <h2>Notifications</h2>

              <p>Control system-wide notification behavior.</p>
            </div>
          </div>

          <div className="preferences-settings-options">
            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Enable System Notifications</strong>

                <span>
                  Enable system-generated notifications throughout the CRM.
                </span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="systemNotificationsEnabled"
                checked={settings.systemNotificationsEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Email Notifications</strong>

                <span>
                  Allow the system to send notifications through email.
                </span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="emailNotificationsEnabled"
                checked={settings.emailNotificationsEnabled}
                onChange={handleChange}
                disabled={!settings.systemNotificationsEnabled}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>In-App Notifications</strong>

                <span>Display notifications inside the CRM interface.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="inAppNotificationsEnabled"
                checked={settings.inAppNotificationsEnabled}
                onChange={handleChange}
                disabled={!settings.systemNotificationsEnabled}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Notification Sound</strong>

                <span>
                  Play a sound when an in-app notification is received.
                </span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="notificationSoundEnabled"
                checked={settings.notificationSoundEnabled}
                onChange={handleChange}
                disabled={
                  !settings.inAppNotificationsEnabled ||
                  !settings.systemNotificationsEnabled
                }
              />
            </label>
          </div>
        </section>

        <section className="preferences-settings-card">
          <div className="preferences-settings-card-header">
            <div className="preferences-settings-card-icon">
              <FaChartBar />
            </div>

            <div>
              <h2>Dashboard Preferences</h2>

              <p>Control the information displayed on dashboards.</p>
            </div>
          </div>

          <div className="preferences-settings-options">
            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Show Statistics Cards</strong>

                <span>Display summary statistics cards on dashboards.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="showStatisticsCards"
                checked={settings.showStatisticsCards}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Show Recent Activity</strong>

                <span>Display recent CRM activity on dashboards.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="showRecentActivity"
                checked={settings.showRecentActivity}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Show Quick Actions</strong>

                <span>Display frequently used actions on dashboards.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="showQuickActions"
                checked={settings.showQuickActions}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <section className="preferences-settings-card">
          <div className="preferences-settings-card-header">
            <div className="preferences-settings-card-icon">
              <FaDatabase />
            </div>

            <div>
              <h2>Data & Records</h2>

              <p>
                Configure record display and automatic data refresh behavior.
              </p>
            </div>
          </div>

          <div className="preferences-settings-options">
            <div className="preferences-settings-grid">
              <div className="preferences-setting-field">
                <label>Records Per Page</label>

                <CustomDropdown
                  value={String(settings.recordsPerPage)}
                  onChange={(value) =>
                    handleDropdownChange("recordsPerPage", Number(value))
                  }
                  options={[
                    {
                      value: "10",
                      label: "10 Records",
                    },
                    {
                      value: "20",
                      label: "20 Records",
                    },
                    {
                      value: "30",
                      label: "30 Records",
                    },
                    {
                      value: "50",
                      label: "50 Records",
                    },
                  ]}
                />
              </div>

              <div className="preferences-setting-field">
                <label>Auto Refresh Interval</label>

                <CustomDropdown
                  value={String(settings.autoRefreshInterval)}
                  onChange={(value) =>
                    handleDropdownChange("autoRefreshInterval", Number(value))
                  }
                  options={[
                    {
                      value: "30",
                      label: "30 Seconds",
                    },
                    {
                      value: "60",
                      label: "60 Seconds",
                    },
                    {
                      value: "120",
                      label: "2 Minutes",
                    },
                    {
                      value: "300",
                      label: "5 Minutes",
                    },
                  ]}
                />
              </div>
            </div>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Confirm Before Delete</strong>

                <span>Ask for confirmation before deleting records.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="confirmBeforeDelete"
                checked={settings.confirmBeforeDelete}
                onChange={handleChange}
              />
            </label>

            <label className="preferences-setting-row">
              <div className="preferences-setting-content">
                <strong>Auto Refresh Data</strong>

                <span>Automatically refresh supported CRM data.</span>
              </div>

              <input
                className="preferences-setting-toggle"
                type="checkbox"
                name="autoRefreshData"
                checked={settings.autoRefreshData}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <div className="preferences-settings-actions">
          <button
            type="button"
            className="preferences-settings-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="preferences-settings-save"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

