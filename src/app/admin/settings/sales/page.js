"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/styles/admin/settings-sales.css";
import CustomDropdown from "@/components/common/CustomDropdown";

import {
  FaArrowLeft,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaShoppingCart,
  FaBell,
} from "react-icons/fa";

const defaultSales = {
  paymentsEnabled: true,
  chapaEnabled: true,
  automaticPaymentVerification: true,
  managerApprovalForExceptions: true,
  installmentsEnabled: true,
  minimumInstallments: 2,
  maximumInstallments: 12,
  minimumDownPayment: 20,
  paymentGracePeriod: 7,
  salesManagementEnabled: true,
  defaultSalesCurrency: "ETB",
  agentCommissionRate: 2,
  paymentNotificationsEnabled: true,
  paymentConfirmationNotifications: true,
  paymentFailureNotifications: true,
  installmentDueNotifications: true,
};

export default function SalesSettingsPage() {
  const [settings, setSettings] = useState(defaultSales);
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

      const response = await fetch("/api/admin/settings/sales");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load sales settings");
      }

      setSettings({
        ...defaultSales,
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

    if (settings.minimumInstallments > settings.maximumInstallments) {
      setError(
        "Minimum installments cannot be greater than maximum installments.",
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/settings/sales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save sales settings");
      }

      setSettings({
        ...defaultSales,
        ...(data.data || {}),
      });

      setMessage("Sales & Payments settings saved successfully.");
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
      <div className="sales-settings-loading">
        <div className="sales-settings-loading-spinner" />
        <p>Loading sales & payments settings...</p>
      </div>
    );
  }

  return (
    <div className="sales-settings-page">
      <div className="sales-settings-header">
        <div className="sales-settings-heading">
          <Link href="/admin/settings" className="sales-settings-back">
            <FaArrowLeft />
            <span>System Configuration</span>
          </Link>

          <div className="sales-settings-title">
            <div>
              <h1>Sales & Payments Settings</h1>

              <p>
                Configure sales, payment verification, installments,
                commissions, and payment notifications.
              </p>
            </div>

            <div className="sales-settings-title-icon">
              <FaCreditCard />
            </div>
          </div>
        </div>
      </div>

      {message && <div className="sales-settings-alert success">{message}</div>}

      {error && <div className="sales-settings-alert error">{error}</div>}

      <form className="sales-settings-form" onSubmit={handleSave}>
        <section className="sales-settings-card">
          <div className="sales-settings-card-header">
            <div className="sales-settings-card-icon">
              <FaCreditCard />
            </div>

            <div>
              <h2>Payment Settings</h2>
              <p>Configure payment processing and verification behavior.</p>
            </div>
          </div>

          <div className="sales-settings-options">
            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Enable Payments</strong>

                <span>
                  Allow clients to make payments for property purchases.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="paymentsEnabled"
                checked={settings.paymentsEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Enable Chapa Payments</strong>

                <span>
                  Allow clients to use Chapa for online property payments.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="chapaEnabled"
                checked={settings.chapaEnabled}
                onChange={handleChange}
                disabled={!settings.paymentsEnabled}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Automatic Payment Verification</strong>

                <span>
                  Automatically verify successful payment transactions through
                  the payment provider.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="automaticPaymentVerification"
                checked={settings.automaticPaymentVerification}
                onChange={handleChange}
                disabled={!settings.paymentsEnabled}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Manager Approval for Payment Exceptions</strong>

                <span>
                  Require manager review when a payment has a mismatch or
                  verification exception.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="managerApprovalForExceptions"
                checked={settings.managerApprovalForExceptions}
                onChange={handleChange}
                disabled={!settings.paymentsEnabled}
              />
            </label>
          </div>
        </section>

        <section className="sales-settings-card">
          <div className="sales-settings-card-header">
            <div className="sales-settings-card-icon">
              <FaFileInvoiceDollar />
            </div>

            <div>
              <h2>Installment Settings</h2>
              <p>
                Define how clients can pay for properties through installments.
              </p>
            </div>
          </div>

          <div className="sales-settings-options">
            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Enable Installment Payments</strong>

                <span>
                  Allow eligible property purchases to be paid through
                  installments.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="installmentsEnabled"
                checked={settings.installmentsEnabled}
                onChange={handleChange}
                disabled={!settings.paymentsEnabled}
              />
            </label>

            <div className="sales-setting-input-row">
              <div className="sales-setting-content">
                <strong>Minimum Installments</strong>

                <span>
                  Minimum number of payments allowed for an installment plan.
                </span>
              </div>

              <input
                className="sales-number-input"
                type="number"
                name="minimumInstallments"
                min="1"
                max="60"
                value={settings.minimumInstallments}
                onChange={handleChange}
                disabled={
                  !settings.installmentsEnabled || !settings.paymentsEnabled
                }
              />
            </div>

            <div className="sales-setting-input-row">
              <div className="sales-setting-content">
                <strong>Maximum Installments</strong>

                <span>
                  Maximum number of payments allowed for an installment plan.
                </span>
              </div>

              <input
                className="sales-number-input"
                type="number"
                name="maximumInstallments"
                min="1"
                max="60"
                value={settings.maximumInstallments}
                onChange={handleChange}
                disabled={
                  !settings.installmentsEnabled || !settings.paymentsEnabled
                }
              />
            </div>

            <div className="sales-setting-input-row">
              <div className="sales-setting-content">
                <strong>Minimum Down Payment</strong>

                <span>
                  Minimum percentage of the property price required before
                  installments begin.
                </span>
              </div>

              <div className="sales-number-with-unit">
                <input
                  className="sales-number-input"
                  type="number"
                  name="minimumDownPayment"
                  min="0"
                  max="100"
                  step="1"
                  value={settings.minimumDownPayment}
                  onChange={handleChange}
                  disabled={
                    !settings.installmentsEnabled || !settings.paymentsEnabled
                  }
                />

                <span>%</span>
              </div>
            </div>

            <div className="sales-setting-input-row">
              <div className="sales-setting-content">
                <strong>Payment Grace Period</strong>

                <span>
                  Number of additional days allowed after an installment due
                  date.
                </span>
              </div>

              <div className="sales-number-with-unit">
                <input
                  className="sales-number-input"
                  type="number"
                  name="paymentGracePeriod"
                  min="0"
                  max="90"
                  step="1"
                  value={settings.paymentGracePeriod}
                  onChange={handleChange}
                  disabled={
                    !settings.installmentsEnabled || !settings.paymentsEnabled
                  }
                />

                <span>days</span>
              </div>
            </div>
          </div>
        </section>

        <section className="sales-settings-card">
          <div className="sales-settings-card-header">
            <div className="sales-settings-card-icon">
              <FaShoppingCart />
            </div>

            <div>
              <h2>Sales Settings</h2>
              <p>Configure sales management and agent commission rules.</p>
            </div>
          </div>

          <div className="sales-settings-options">
            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Enable Sales Management</strong>

                <span>
                  Allow the CRM to manage property sales and transactions.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="salesManagementEnabled"
                checked={settings.salesManagementEnabled}
                onChange={handleChange}
              />
            </label>

            <div className="sales-settings-defaults-grid">
              <div className="sales-setting-field">
                <label>Default Sales Currency</label>

                <CustomDropdown
                  value={settings.defaultSalesCurrency}
                  onChange={(value) =>
                    handleDropdownChange("defaultSalesCurrency", value)
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

              <div className="sales-setting-field">
                <label>Agent Commission Rate</label>

                <div className="sales-number-with-unit">
                  <input
                    className="sales-number-input"
                    type="number"
                    name="agentCommissionRate"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.agentCommissionRate}
                    onChange={handleChange}
                    disabled={!settings.salesManagementEnabled}
                  />

                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="sales-settings-card">
          <div className="sales-settings-card-header">
            <div className="sales-settings-card-icon">
              <FaBell />
            </div>

            <div>
              <h2>Payment Notifications</h2>
              <p>Control notifications related to payment activity.</p>
            </div>
          </div>

          <div className="sales-settings-options">
            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Enable Payment Notifications</strong>

                <span>
                  Enable payment-related notifications throughout the CRM.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="paymentNotificationsEnabled"
                checked={settings.paymentNotificationsEnabled}
                onChange={handleChange}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Payment Confirmation Notifications</strong>

                <span>
                  Notify clients and relevant users when a payment is
                  successfully confirmed.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="paymentConfirmationNotifications"
                checked={settings.paymentConfirmationNotifications}
                onChange={handleChange}
                disabled={!settings.paymentNotificationsEnabled}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Payment Failure Notifications</strong>

                <span>
                  Notify relevant users when a payment fails or cannot be
                  verified.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="paymentFailureNotifications"
                checked={settings.paymentFailureNotifications}
                onChange={handleChange}
                disabled={!settings.paymentNotificationsEnabled}
              />
            </label>

            <label className="sales-setting-row">
              <div className="sales-setting-content">
                <strong>Installment Due Notifications</strong>

                <span>
                  Notify clients about upcoming or overdue installment payments.
                </span>
              </div>

              <input
                className="sales-setting-toggle"
                type="checkbox"
                name="installmentDueNotifications"
                checked={settings.installmentDueNotifications}
                onChange={handleChange}
                disabled={
                  !settings.paymentNotificationsEnabled ||
                  !settings.installmentsEnabled
                }
              />
            </label>
          </div>
        </section>

        <div className="sales-settings-actions">
          <button
            type="button"
            className="sales-settings-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="sales-settings-save"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

