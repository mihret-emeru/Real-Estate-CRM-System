"use client";

import Link from "next/link";

import {
  FaCog,
  FaHome,
  FaUsers,
  FaMoneyBillWave,
  FaSlidersH,
  FaShieldAlt,
  FaChevronRight,
} from "react-icons/fa";

import "@/styles/admin/settings.css";

export default function AdminSettingsPage() {
  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <span className="admin-settings-eyebrow">Administration</span>

          <h1>System Configuration</h1>

          <p>Manage system-wide settings and CRM preferences.</p>
        </div>

        <div className="admin-settings-header-icon">
          <FaCog />
        </div>
      </div>

      <div className="admin-settings-grid">
        <Link href="/admin/settings/general" className="admin-settings-card">
          <div className="admin-settings-card-icon">
            <FaCog />
          </div>

          <div className="admin-settings-card-content">
            <span>Configuration</span>

            <h2>General Settings</h2>

            <p>
              Manage company information, contact details, and system defaults.
            </p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>

        <Link href="/admin/settings/properties" className="admin-settings-card">
          <div className="admin-settings-card-icon">
            <FaHome />
          </div>

          <div className="admin-settings-card-content">
            <span>Listings</span>

            <h2>Property Settings</h2>

            <p>Configure property types, statuses, and listing preferences.</p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>

        <Link href="/admin/settings/crm" className="admin-settings-card">
          <div className="admin-settings-card-icon">
            <FaUsers />
          </div>

          <div className="admin-settings-card-content">
            <span>Management</span>

            <h2>CRM Settings</h2>

            <p>Configure lead workflow, lead sources, and CRM behavior.</p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>

        <Link href="/admin/settings/sales" className="admin-settings-card">
          <div className="admin-settings-card-icon">
            <FaMoneyBillWave />
          </div>

          <div className="admin-settings-card-content">
            <span>Finance</span>

            <h2>Sales & Payments</h2>

            <p>Manage payment methods, sales, and installment preferences.</p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>

        <Link
          href="/admin/settings/preferences"
          className="admin-settings-card"
        >
          <div className="admin-settings-card-icon">
            <FaSlidersH />
          </div>

          <div className="admin-settings-card-content">
            <span>Application</span>

            <h2>System Preferences</h2>

            <p>Configure application preferences and display options.</p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>

        <Link href="/admin/settings/security" className="admin-settings-card">
          <div className="admin-settings-card-icon">
            <FaShieldAlt />
          </div>

          <div className="admin-settings-card-content">
            <span>Protection</span>

            <h2>Security Settings</h2>

            <p>
              Manage password policies, login security, and account protection.
            </p>
          </div>

          <div className="admin-settings-card-arrow">
            <FaChevronRight />
          </div>
        </Link>
      </div>
    </div>
  );
}

