"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaBell, FaPalette, FaUser } from "react-icons/fa";
import "@/styles/settings.css";

const DEFAULT_SETTINGS = {
  theme: "light",
  emailNotifications: true,
  inAppNotifications: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("crm-settings");

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme, isLoaded]);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
  };

  const handleSave = () => {
    try {
      localStorage.setItem("crm-settings", JSON.stringify(settings));
      setMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage("Unable to save settings. Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <main className="settings-page">
        <p>Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <Link href="/profile" className="settings-back-link">
          <FaArrowLeft /> Back to Profile
        </Link>

        <h1>Settings</h1>
        <p>Customize your Real Estate CRM experience.</p>
      </header>

      {message && (
        <div className="settings-success" role="status" aria-live="polite">
          {message}
        </div>
      )}

      <section className="settings-card">
        <div className="settings-section-heading">
          <FaPalette />
          <div>
            <h2>Appearance</h2>
            <p>Choose your preferred dashboard appearance.</p>
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="theme">Dashboard theme</label>
          <select
            id="theme"
            value={settings.theme}
            onChange={(event) => updateSetting("theme", event.target.value)}
          >
            <option value="light">Light mode</option>
            <option value="dark">Dark mode</option>
          </select>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <FaBell />
          <div>
            <h2>Notifications</h2>
            <p>Choose your notification preferences.</p>
          </div>
        </div>

        <label className="settings-toggle">
          <span>
            <strong>Email notifications</strong>
            <small>Enable or disable email notification preferences.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(event) =>
              updateSetting("emailNotifications", event.target.checked)
            }
          />
        </label>

        <label className="settings-toggle">
          <span>
            <strong>In-app notifications</strong>
            <small>Enable or disable in-app notification preferences.</small>
          </span>
          <input
            type="checkbox"
            checked={settings.inAppNotifications}
            onChange={(event) =>
              updateSetting("inAppNotifications", event.target.checked)
            }
          />
        </label>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <FaUser />
          <div>
            <h2>Account Preferences</h2>
            <p>Manage your personal account information.</p>
          </div>
        </div>

        <Link href="/profile" className="settings-profile-link">
          Manage My Profile
        </Link>
      </section>

      <div className="settings-actions">
        <button type="button" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </main>
  );
}
