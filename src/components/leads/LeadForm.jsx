"use client";

import { useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";

export default function LeadForm({
  initialData = {},
  onSubmit,
  submitText = "Save Lead",
}) {
  const [formData, setFormData] = useState({
    fullName: initialData.fullName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",

    source: initialData.source || "",
    status: initialData.status || "new",
    notes: initialData.notes || "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Lead Information</h2>

        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter full name"
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email"
          required
        />

        <label>Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          required
        />
        <div className="form-row">
          <div className="form-group">
            <label>Lead Source</label>

            <CustomDropdown
              name="source"
              value={formData.source}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  source: value,
                })
              }
              options={[
                {
                  value: "phone_call",
                  label: "Phone Call",
                },
                {
                  value: "office_visit",
                  label: "Office Visit",
                },
                {
                  value: "referral",
                  label: "Referral",
                },
              ]}
            />
          </div>

          <div className="form-group">
            <label>Lead Status</label>
            <CustomDropdown
              name="status"
              value={formData.status}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  status: value,
                })
              }
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
                {
                  value: "negotiation",
                  label: "Negotiation",
                },
                {
                  value: "won",
                  label: "Won",
                },
                {
                  value: "lost",
                  label: "Lost",
                },
              ]}
            />
          </div>
        </div>

        <h2>Notes</h2>

        <label>Notes</label>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Write notes about this lead..."
          rows={5}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-btn">
          {submitText}
        </button>
      </div>
    </form>
  );
}
