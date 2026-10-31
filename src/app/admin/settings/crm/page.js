"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "@/components/common/BackLink";

import {
  FaArrowLeft,
  FaSave,
  FaUserTag,
  FaCalendarAlt,
  FaUsers,
  FaBell,
} from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";

import "@/styles/admin/settings-crm.css";

const defaultFormData = {
  leadManagementEnabled: true,
  defaultLeadStatus: "new",
  followUpReminder: 24,
  autoLeadAssignment: false,

  appointmentsEnabled: true,
  appointmentDuration: 60,
  allowClientRescheduling: true,
  requireAgentConfirmation: true,

  clientRegistrationEnabled: true,
  allowClientPreferenceUpdates: true,
  requireClientPhone: true,

  notificationsEnabled: true,
  leadAssignmentNotifications: true,
  appointmentNotifications: true,
  paymentNotifications: true,
};

export default function AdminCRMSettingsPage() {
  const [formData, setFormData] = useState(defaultFormData);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function fetchSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings/crm", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load CRM settings.");
      }

      setFormData({
        ...defaultFormData,
        ...(data.data || {}),
      });
    } catch (error) {
      console.error("Load CRM settings error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load CRM settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  function handleToggle(name) {
    setFormData((current) => ({
      ...current,
      [name]: !current[name],
    }));

    setSaved(false);
    setError("");
  }

  function handleSelect(name, value) {
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

      const response = await fetch("/api/admin/settings/crm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save CRM settings.");
      }

      setFormData({
        ...defaultFormData,
        ...(data.data || {}),
      });

      setSaved(true);
    } catch (error) {
      console.error("Save CRM settings error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to save CRM settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-settings-crm-page">
        <div className="admin-settings-crm-loading">
          Loading CRM settings...
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="admin-settings-crm-page">
        <div className="admin-settings-crm-error">
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
    <div className="admin-settings-crm-page">
      <div className="admin-settings-crm-topbar">
        <BackLink href="/admin/settings" label="Back to System Configuration" />
      </div>

      <div className="admin-settings-crm-header">
        <div>
          <span className="admin-settings-crm-eyebrow">
            System Configuration
          </span>

          <h1>CRM Settings</h1>

          <p>
            Configure lead management, appointments, clients, and CRM
            notifications.
          </p>
        </div>

        <div className="admin-settings-crm-header-icon">
          <FaUserTag />
        </div>
      </div>

      <form className="admin-settings-crm-form" onSubmit={handleSubmit}>
        <section className="admin-settings-crm-section">
          <div className="admin-settings-crm-section-header">
            <div className="admin-settings-crm-section-icon">
              <FaUserTag />
            </div>

            <div>
              <span>Leads</span>

              <h2>Lead Management</h2>

              <p>Control how leads are handled throughout the CRM.</p>
            </div>
          </div>

          <div className="admin-settings-crm-options">
            <div className="admin-settings-crm-option">
              <div>
                <strong>Enable Lead Management</strong>

                <span>Allow the CRM to manage and track leads.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.leadManagementEnabled ? "active" : ""
                }`}
                onClick={() => handleToggle("leadManagementEnabled")}
                aria-label="Enable Lead Management"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-grid">
              <div className="admin-settings-crm-field">
                <label>Default Lead Status</label>

                <CustomDropdown
                  value={formData.defaultLeadStatus}
                  onChange={(value) => handleSelect("defaultLeadStatus", value)}
                  options={[
                    {
                      value: "new",
                      label: "New",
                    },
                    {
                      value: "contacted",
                      label: "Contacted",
                    },
                    {
                      value: "qualified",
                      label: "Qualified",
                    },
                  ]}
                />
              </div>

              <div className="admin-settings-crm-field">
                <label>Follow-up Reminder</label>

                <CustomDropdown
                  value={String(formData.followUpReminder)}
                  onChange={(value) =>
                    handleSelect("followUpReminder", Number(value))
                  }
                  options={[
                    {
                      value: "12",
                      label: "12 hours",
                    },
                    {
                      value: "24",
                      label: "24 hours",
                    },
                    {
                      value: "48",
                      label: "48 hours",
                    },
                    {
                      value: "72",
                      label: "72 hours",
                    },
                  ]}
                />
              </div>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Automatic Lead Assignment</strong>

                <span>Automatically assign new leads to available agents.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.autoLeadAssignment ? "active" : ""
                }`}
                onClick={() => handleToggle("autoLeadAssignment")}
                aria-label="Automatic Lead Assignment"
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        <section className="admin-settings-crm-section">
          <div className="admin-settings-crm-section-header">
            <div className="admin-settings-crm-section-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <span>Scheduling</span>

              <h2>Appointment Settings</h2>

              <p>Configure property viewing and appointment behavior.</p>
            </div>
          </div>

          <div className="admin-settings-crm-options">
            <div className="admin-settings-crm-option">
              <div>
                <strong>Enable Appointments</strong>

                <span>
                  Allow clients and agents to manage property viewing
                  appointments.
                </span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.appointmentsEnabled ? "active" : ""
                }`}
                onClick={() => handleToggle("appointmentsEnabled")}
                aria-label="Enable Appointments"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-grid">
              <div className="admin-settings-crm-field">
                <label>Default Appointment Duration</label>

                <CustomDropdown
                  value={String(formData.appointmentDuration)}
                  onChange={(value) =>
                    handleSelect("appointmentDuration", Number(value))
                  }
                  options={[
                    {
                      value: "30",
                      label: "30 minutes",
                    },
                    {
                      value: "60",
                      label: "60 minutes",
                    },
                    {
                      value: "90",
                      label: "90 minutes",
                    },
                    {
                      value: "120",
                      label: "120 minutes",
                    },
                  ]}
                />
              </div>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Allow Client Rescheduling</strong>

                <span>
                  Allow clients to request changes to their appointment time.
                </span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.allowClientRescheduling ? "active" : ""
                }`}
                onClick={() => handleToggle("allowClientRescheduling")}
                aria-label="Allow Client Rescheduling"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Require Agent Confirmation</strong>

                <span>
                  Require the assigned agent to confirm an appointment.
                </span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.requireAgentConfirmation ? "active" : ""
                }`}
                onClick={() => handleToggle("requireAgentConfirmation")}
                aria-label="Require Agent Confirmation"
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        <section className="admin-settings-crm-section">
          <div className="admin-settings-crm-section-header">
            <div className="admin-settings-crm-section-icon">
              <FaUsers />
            </div>

            <div>
              <span>Clients</span>

              <h2>Client Management</h2>

              <p>Control client registration and profile preferences.</p>
            </div>
          </div>

          <div className="admin-settings-crm-options">
            <div className="admin-settings-crm-option">
              <div>
                <strong>Enable Client Registration</strong>

                <span>Allow visitors to create client accounts.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.clientRegistrationEnabled ? "active" : ""
                }`}
                onClick={() => handleToggle("clientRegistrationEnabled")}
                aria-label="Enable Client Registration"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Allow Client Preference Updates</strong>

                <span>Allow clients to update their property preferences.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.allowClientPreferenceUpdates ? "active" : ""
                }`}
                onClick={() => handleToggle("allowClientPreferenceUpdates")}
                aria-label="Allow Client Preference Updates"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Require Client Phone Number</strong>

                <span>
                  Require a phone number when creating a client account.
                </span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.requireClientPhone ? "active" : ""
                }`}
                onClick={() => handleToggle("requireClientPhone")}
                aria-label="Require Client Phone Number"
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        <section className="admin-settings-crm-section">
          <div className="admin-settings-crm-section-header">
            <div className="admin-settings-crm-section-icon">
              <FaBell />
            </div>

            <div>
              <span>Alerts</span>

              <h2>CRM Notifications</h2>

              <p>Configure important notifications generated by the CRM.</p>
            </div>
          </div>

          <div className="admin-settings-crm-options">
            <div className="admin-settings-crm-option">
              <div>
                <strong>Enable CRM Notifications</strong>

                <span>Enable system notifications for CRM events.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.notificationsEnabled ? "active" : ""
                }`}
                onClick={() => handleToggle("notificationsEnabled")}
                aria-label="Enable CRM Notifications"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Lead Assignment Notifications</strong>

                <span>Notify agents when a lead is assigned to them.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.leadAssignmentNotifications ? "active" : ""
                }`}
                onClick={() => handleToggle("leadAssignmentNotifications")}
                aria-label="Lead Assignment Notifications"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Appointment Notifications</strong>

                <span>Notify relevant users about appointment events.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.appointmentNotifications ? "active" : ""
                }`}
                onClick={() => handleToggle("appointmentNotifications")}
                aria-label="Appointment Notifications"
              >
                <span />
              </button>
            </div>

            <div className="admin-settings-crm-option">
              <div>
                <strong>Payment Notifications</strong>

                <span>Notify managers and clients about payment events.</span>
              </div>

              <button
                type="button"
                className={`admin-settings-crm-switch ${
                  formData.paymentNotifications ? "active" : ""
                }`}
                onClick={() => handleToggle("paymentNotifications")}
                aria-label="Payment Notifications"
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="admin-settings-crm-error-message">{error}</div>
        )}

        {saved && (
          <div className="admin-settings-crm-success">
            CRM settings saved successfully.
          </div>
        )}

        <div className="admin-settings-crm-actions">
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
