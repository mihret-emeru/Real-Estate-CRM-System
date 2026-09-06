"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/admin/settings-security.css";
import CustomDropdown from "@/components/common/CustomDropdown";

import {
  FaArrowLeft,
  FaShieldAlt,
  FaLock,
  FaUserShield,
  FaSignInAlt,
  FaClipboardList,
  FaUserCog,
} from "react-icons/fa";

const defaultSecurity = {
  requireStrongPasswords: true,
  passwordMinimumLength: 8,
  requireEmailVerification: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  accountLockoutDuration: 15,

  twoFactorAuthentication: false,
  require2FAForAdmins: false,
  require2FAForManagers: false,

  loginNotifications: true,
  trackFailedLoginAttempts: true,
  accountLockout: true,
  allowMultipleActiveSessions: true,

  auditLogging: true,
  logUserChanges: true,
  logPropertyChanges: true,
  logSalesPaymentChanges: true,
  logAuthenticationEvents: true,

  confirmSensitiveAdminActions: true,
  requirePasswordForCriticalActions: true,
  protectAdminAccounts: true,
};

export default function SecuritySettingsPage() {
  const [security, setSecurity] = useState(defaultSecurity);
  const [originalSecurity, setOriginalSecurity] = useState(defaultSecurity);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchSecuritySettings() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/settings/security", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load security settings.");
      }

      const settings = {
        ...defaultSecurity,
        ...(data.data || {}),
      };

      setSecurity(settings);
      setOriginalSecurity(settings);
    } catch (err) {
      console.error("Failed to fetch security settings:", err);

      setError(err.message || "Failed to load security settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setSecurity((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleNumberChange(event) {
    const { name, value } = event.target;

    setSecurity((current) => ({
      ...current,
      [name]: Number(value),
    }));
  }

  function handleDropdownChange(name, value) {
    setSecurity((current) => ({
      ...current,
      [name]: Number(value),
    }));
  }

  function handleCancel() {
    setSecurity(originalSecurity);
    setError("");
    setMessage("");
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/security", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(security),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save security settings.");
      }

      const savedSettings = {
        ...defaultSecurity,
        ...(data.data || security),
      };

      setSecurity(savedSettings);
      setOriginalSecurity(savedSettings);

      setMessage(data.message || "Security settings saved successfully.");
    } catch (err) {
      console.error("Failed to save security settings:", err);

      setError(err.message || "Failed to save security settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="security-settings-loading">
        <div className="security-settings-loading-spinner"></div>
        <p>Loading security settings...</p>
      </div>
    );
  }

  return (
    <div className="security-settings-page">
      <div className="security-settings-header">
        <Link href="/admin/settings" className="security-settings-back">
          <FaArrowLeft />
          <span>Back to Settings</span>
        </Link>

        <div className="security-settings-heading">
          <div className="security-settings-title">
            <div>
              <h1>Security Settings</h1>

              <p>
                Manage authentication, login protection, auditing, and
                administrative security.
              </p>
            </div>

            <FaShieldAlt className="security-settings-title-icon" />
          </div>
        </div>
      </div>

      {error && <div className="security-settings-alert error">{error}</div>}

      {message && (
        <div className="security-settings-alert success">{message}</div>
      )}

      <form className="security-settings-form" onSubmit={handleSave}>
        <div className="security-settings-card">
          <div className="security-settings-card-header">
            <div className="security-settings-card-icon">
              <FaLock />
            </div>

            <div>
              <h2>Authentication Security</h2>

              <p>Configure password and account authentication requirements.</p>
            </div>
          </div>

          <div className="security-settings-options">
            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Require Strong Passwords</h3>

                <p>Require users to use stronger passwords.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="requireStrongPasswords"
                  checked={security.requireStrongPasswords}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Password Minimum Length</h3>

                <p>Minimum number of characters required for passwords.</p>
              </div>

              <div className="security-setting-field">
                <input
                  type="number"
                  name="passwordMinimumLength"
                  min="6"
                  max="32"
                  value={security.passwordMinimumLength}
                  onChange={handleNumberChange}
                />
              </div>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Require Email Verification</h3>

                <p>Require users to verify their email address.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="requireEmailVerification"
                  checked={security.requireEmailVerification}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Session Timeout</h3>

                <p>Session duration before requiring authentication again.</p>
              </div>

              <CustomDropdown
                value={String(security.sessionTimeout)}
                onChange={(value) =>
                  handleDropdownChange("sessionTimeout", value)
                }
                options={[
                  {
                    value: "15",
                    label: "15 minutes",
                  },
                  {
                    value: "30",
                    label: "30 minutes",
                  },
                  {
                    value: "60",
                    label: "1 hour",
                  },
                  {
                    value: "120",
                    label: "2 hours",
                  },
                  {
                    value: "240",
                    label: "4 hours",
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="security-settings-card">
          <div className="security-settings-card-header">
            <div className="security-settings-card-icon">
              <FaUserShield />
            </div>

            <div>
              <h2>Two-Factor Authentication</h2>

              <p>
                Add an additional authentication layer to protected accounts.
              </p>
            </div>
          </div>

          <div className="security-settings-options">
            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Enable Two-Factor Authentication</h3>

                <p>Allow two-factor authentication for user accounts.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="twoFactorAuthentication"
                  checked={security.twoFactorAuthentication}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Require 2FA for Administrators</h3>

                <p>Require administrators to use two-factor authentication.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="require2FAForAdmins"
                  checked={security.require2FAForAdmins}
                  disabled={!security.twoFactorAuthentication}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Require 2FA for Managers</h3>

                <p>Require managers to use two-factor authentication.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="require2FAForManagers"
                  checked={security.require2FAForManagers}
                  disabled={!security.twoFactorAuthentication}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-settings-card">
          <div className="security-settings-card-header">
            <div className="security-settings-card-icon">
              <FaSignInAlt />
            </div>

            <div>
              <h2>Login Security</h2>

              <p>
                Control login attempts, account lockouts, and session behavior.
              </p>
            </div>
          </div>

          <div className="security-settings-options">
            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Track Failed Login Attempts</h3>

                <p>Record failed login attempts for security monitoring.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="trackFailedLoginAttempts"
                  checked={security.trackFailedLoginAttempts}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Maximum Login Attempts</h3>

                <p>Number of failed attempts before account lockout.</p>
              </div>

              <CustomDropdown
                value={String(security.maxLoginAttempts)}
                onChange={(value) =>
                  handleDropdownChange("maxLoginAttempts", value)
                }
                options={[
                  {
                    value: "3",
                    label: "3 attempts",
                  },
                  {
                    value: "5",
                    label: "5 attempts",
                  },
                  {
                    value: "10",
                    label: "10 attempts",
                  },
                ]}
              />
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Account Lockout</h3>

                <p>
                  Automatically lock accounts after too many failed login
                  attempts.
                </p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="accountLockout"
                  checked={security.accountLockout}
                  disabled={!security.trackFailedLoginAttempts}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Account Lockout Duration</h3>

                <p>How long an account remains locked.</p>
              </div>

              <CustomDropdown
                value={String(security.accountLockoutDuration)}
                onChange={(value) =>
                  handleDropdownChange("accountLockoutDuration", value)
                }
                options={[
                  {
                    value: "5",
                    label: "5 minutes",
                  },
                  {
                    value: "15",
                    label: "15 minutes",
                  },
                  {
                    value: "30",
                    label: "30 minutes",
                  },
                  {
                    value: "60",
                    label: "1 hour",
                  },
                ]}
              />
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Login Notifications</h3>

                <p>Notify users when a successful login occurs.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="loginNotifications"
                  checked={security.loginNotifications}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Allow Multiple Active Sessions</h3>

                <p>
                  Allow the same user account to remain logged in on multiple
                  devices.
                </p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="allowMultipleActiveSessions"
                  checked={security.allowMultipleActiveSessions}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-settings-card">
          <div className="security-settings-card-header">
            <div className="security-settings-card-icon">
              <FaClipboardList />
            </div>

            <div>
              <h2>Audit & Activity</h2>

              <p>Control security and activity logging.</p>
            </div>
          </div>

          <div className="security-settings-options">
            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Enable Audit Logging</h3>

                <p>Record important system and user activities.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="auditLogging"
                  checked={security.auditLogging}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Log User Changes</h3>

                <p>Record changes made to user accounts.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="logUserChanges"
                  checked={security.logUserChanges}
                  disabled={!security.auditLogging}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Log Property Changes</h3>

                <p>Record important property modifications.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="logPropertyChanges"
                  checked={security.logPropertyChanges}
                  disabled={!security.auditLogging}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Log Sales & Payment Changes</h3>

                <p>Record important sales and payment changes.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="logSalesPaymentChanges"
                  checked={security.logSalesPaymentChanges}
                  disabled={!security.auditLogging}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Log Authentication Events</h3>

                <p>Record login and authentication events.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="logAuthenticationEvents"
                  checked={security.logAuthenticationEvents}
                  disabled={!security.auditLogging}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-settings-card">
          <div className="security-settings-card-header">
            <div className="security-settings-card-icon">
              <FaUserCog />
            </div>

            <div>
              <h2>Administrative Protection</h2>

              <p>
                Add additional protection for sensitive administrative actions.
              </p>
            </div>
          </div>

          <div className="security-settings-options">
            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Confirm Sensitive Admin Actions</h3>

                <p>
                  Require confirmation before sensitive administrative actions.
                </p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="confirmSensitiveAdminActions"
                  checked={security.confirmSensitiveAdminActions}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Require Password for Critical Actions</h3>

                <p>
                  Require the administrator password for critical system
                  actions.
                </p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="requirePasswordForCriticalActions"
                  checked={security.requirePasswordForCriticalActions}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>

            <div className="security-setting-row">
              <div className="security-setting-content">
                <h3>Protect Administrator Accounts</h3>

                <p>Prevent sensitive changes to administrator accounts.</p>
              </div>

              <label className="security-setting-toggle">
                <input
                  type="checkbox"
                  name="protectAdminAccounts"
                  checked={security.protectAdminAccounts}
                  onChange={handleChange}
                />

                <span></span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-settings-actions">
          <button
            type="button"
            className="security-settings-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="security-settings-save"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

