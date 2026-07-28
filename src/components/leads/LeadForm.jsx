"use client";

import { useState } from "react";

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
        <h2>Lead Source</h2>

        <label>Source</label>

        <select
          name="source"
          value={formData.source}
          onChange={handleChange}
          required
        >
          <option value="">Select Lead Source</option>

          <option value="phone_call">Phone Call</option>

          <option value="office_visit">Office Visit</option>

          <option value="referral">Referral</option>
        </select>
        <h2>Lead Status</h2>

        <label>Status</label>

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

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
