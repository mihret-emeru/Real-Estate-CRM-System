"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaUserCircle, FaSave, FaArrowLeft, FaCamera } from "react-icons/fa";
import Link from "next/link";
import "@/styles/profile.css";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  preferredPropertyType: "other",
  minBudget: "",
  maxBudget: "",
  currency: "ETB",
  profileImage: "",
  role: "",
  isActive: true,
};

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const dashboardPath =
    {
      admin: "/admin/dashboard",
      manager: "/manager/dashboard",
      agent: "/agent/dashboard",
      client: "/client/dashboard",
    }[session?.user?.role] || "/";

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const photoInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/profile";
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);

        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load profile.");
        }

        if (!cancelled) {
          const user = result.data;

          setForm({
            ...initialForm,
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            city: user.city || "",
            preferredPropertyType: user.preferredPropertyType || "other",
            minBudget: user.minBudget ?? "",
            maxBudget: user.maxBudget ?? "",
            currency: user.currency || "ETB",
            profileImage: user.profileImage || "",
            role: user.role || "",
            isActive: user.isActive,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Failed to load profile.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [status]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again later.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please choose a JPG, PNG, or WebP image.");
      setMessageType("error");
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setMessage("Your photo must be smaller than 5 MB.");
      setMessageType("error");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotoPreview(previewUrl);
    setUploadingPhoto(true);
    setMessage("");
    setMessageType("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload photo.");
      }

      setForm((current) => ({
        ...current,
        profileImage: result.data.profileImage,
      }));

      setPhotoPreview("");

      setMessage("Profile photo updated successfully.");
      setMessageType("success");
    } catch (error) {
      setPhotoPreview("");

      setMessage(error.message || "Failed to upload photo.");
      setMessageType("error");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        city: form.city,
      };

      if (form.role === "client") {
        payload.preferredPropertyType = form.preferredPropertyType;
        payload.minBudget = form.minBudget;
        payload.maxBudget = form.maxBudget;
        payload.currency = form.currency;
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update profile.");
      }

      const user = result.data;

      setForm((current) => ({
        ...current,
        name: user.name || "",
        phone: user.phone || "",
        city: user.city || "",
        preferredPropertyType: user.preferredPropertyType || "other",
        minBudget: user.minBudget ?? "",
        maxBudget: user.maxBudget ?? "",
        currency: user.currency || "ETB",
      }));

      setMessage("Your profile has been updated successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!session) return null;

  const initials = form.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div>
          <Link href={dashboardPath} className="profile-back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>

          <h1>My Profile</h1>
          <p>View and manage your personal account information.</p>
        </div>
      </div>

      <div className="profile-layout">
        <aside className="profile-summary-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {photoPreview || form.profileImage ? (
                <img src={photoPreview || form.profileImage} alt="Profile" />
              ) : initials ? (
                initials
              ) : (
                <FaUserCircle />
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              hidden
            />

            <button
              type="button"
              className="profile-photo-upload-btn"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <FaCamera />
              {uploadingPhoto ? "Uploading..." : "Change Photo"}
            </button>
          </div>

          <h2>{form.name || "Your Name"}</h2>
          <p className="profile-summary-email">{form.email}</p>

          <span className="profile-role-badge">
            {form.role
              ? form.role.charAt(0).toUpperCase() + form.role.slice(1)
              : "User"}
          </span>

          <div className="profile-account-status">
            <span
              className={`profile-status-dot ${
                form.isActive ? "active" : "inactive"
              }`}
            />
            {form.isActive ? "Active Account" : "Inactive Account"}
          </div>

          <p className="profile-summary-note">
            Your role and account status are managed by the CRM administrator.
          </p>
        </aside>

        <section className="profile-form-card">
          <div className="profile-section-heading">
            <h2>Personal Information</h2>
            <p>Update the information associated with your account.</p>
          </div>

          {message && (
            <div className={`profile-message ${messageType}`} role="status">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  readOnly
                  disabled
                />
                <small>
                  Contact your administrator if this needs to change.
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={30}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="Enter your city"
                />
              </div>
            </div>

            {form.role === "client" && (
              <>
                <div className="profile-section-heading profile-preferences-heading">
                  <h2>Property Preferences</h2>
                  <p>Help us understand the properties you are looking for.</p>
                </div>

                <div className="profile-form-grid">
                  <div className="profile-field">
                    <label htmlFor="preferredPropertyType">
                      Preferred Property Type
                    </label>
                    <select
                      id="preferredPropertyType"
                      name="preferredPropertyType"
                      value={form.preferredPropertyType}
                      onChange={handleChange}
                    >
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="currency">Budget Currency</label>
                    <select
                      id="currency"
                      name="currency"
                      value={form.currency}
                      onChange={handleChange}
                    >
                      <option value="ETB">ETB — Ethiopian Birr</option>
                      <option value="USD">USD — US Dollar</option>
                    </select>
                  </div>

                  <div className="profile-field">
                    <label htmlFor="minBudget">Minimum Budget</label>
                    <input
                      id="minBudget"
                      name="minBudget"
                      type="number"
                      min="0"
                      value={form.minBudget}
                      onChange={handleChange}
                      placeholder="Minimum budget"
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="maxBudget">Maximum Budget</label>
                    <input
                      id="maxBudget"
                      name="maxBudget"
                      type="number"
                      min="0"
                      value={form.maxBudget}
                      onChange={handleChange}
                      placeholder="Maximum budget"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="profile-form-actions">
              <button
                type="submit"
                className="profile-save-btn"
                disabled={saving}
              >
                <FaSave />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
