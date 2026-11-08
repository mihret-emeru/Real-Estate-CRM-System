"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomDropdown from "@/components/common/CustomDropdown";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterForm({ propertyId, conversion, returnTo }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "",
    preferredPropertyType: "",
    minBudget: "",
    maxBudget: "",
    currency: "ETB",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRules = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePropertyTypeChange = (value) => {
    setFormData((current) => ({
      ...current,
      preferredPropertyType: value,
    }));
  };

  const handleCurrencyChange = (value) => {
    setFormData((current) => ({
      ...current,
      currency: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!isPasswordValid) {
      setError("Please ensure your password meets all the requirements.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setError("Please enter a valid international phone number.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          city: formData.city,
          preferredPropertyType: formData.preferredPropertyType,
          minBudget: formData.minBudget,
          maxBudget: formData.maxBudget,
          currency: formData.currency,
        }),
      });

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        console.log(data.error);
        setError(data.error || data.message);
        return;
      }

      alert("Account created successfully!");

      if (propertyId && conversion) {
        const loginParams = new URLSearchParams();

        loginParams.set("propertyId", propertyId);
        loginParams.set("conversion", conversion);

        if (returnTo) {
          loginParams.set("returnTo", returnTo);
        }

        window.location.href = `/login?${loginParams.toString()}`;
        return;
      }
      window.location.href = "/login";
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginHref =
    propertyId && conversion
      ? `/login?propertyId=${encodeURIComponent(
          propertyId,
        )}&conversion=${encodeURIComponent(
          conversion,
        )}&returnTo=${encodeURIComponent(returnTo || "")}`
      : "/login";

  return (
    <div className="register-card">
      <Image
        src="/images/logo.jpg"
        alt="Real Estate CRM"
        width={80}
        height={80}
        className="register-logo"
      />

      <h1>Create Account</h1>

      <p>Create your client account to access the Real Estate CRM.</p>

      {error && <div className="login-error">{error}</div>}

      <form onSubmit={handleRegister}>
        <div className="register-grid">
          <div>
            <div className="register-field">
              <label>Full Name</label>

              <div className="register-input">
                <FaUser />

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Phone Number</label>

              <div className="register-input phone-input-wrapper">
                <PhoneInput
                  international
                  defaultCountry="ET"
                  countryCallingCodeEditable={false}
                  value={formData.phone || undefined}
                  onChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      phone: value || "",
                    }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Password</label>

              <div className="register-input">
                <FaLock />

                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="password-requirements">
              <small>Password must contain:</small>

              <ul>
                <li
                  style={{ color: passwordRules.minLength ? "green" : "#777" }}
                >
                  {passwordRules.minLength ? "✓" : "○"} At least 8 characters
                </li>

                <li
                  style={{ color: passwordRules.uppercase ? "green" : "#777" }}
                >
                  {passwordRules.uppercase ? "✓" : "○"} One uppercase letter
                </li>

                <li
                  style={{ color: passwordRules.lowercase ? "green" : "#777" }}
                >
                  {passwordRules.lowercase ? "✓" : "○"} One lowercase letter
                </li>

                <li style={{ color: passwordRules.number ? "green" : "#777" }}>
                  {passwordRules.number ? "✓" : "○"} One number
                </li>

                <li style={{ color: passwordRules.special ? "green" : "#777" }}>
                  {passwordRules.special ? "✓" : "○"} One special character
                </li>
              </ul>
            </div>

            <div className="register-field">
              <label>Confirm Password</label>

              <div className="register-input">
                <FaLock />

                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Minimum Budget</label>

              <div className="register-input">
                <input
                  type="number"
                  name="minBudget"
                  value={formData.minBudget}
                  onChange={handleChange}
                  placeholder="Minimum"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="register-field">
              <label>Email</label>

              <div className="register-input">
                <FaEnvelope />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Preferred Location</label>

              <div className="register-input">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Bole, Mexico, Saris"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Preferred Property Type</label>

              <div className="register-input">
                <CustomDropdown
                  value={formData.preferredPropertyType}
                  onChange={handlePropertyTypeChange}
                  placeholder="Select Property Type"
                  options={[
                    { value: "apartment", label: "Apartment" },
                    { value: "villa", label: "Villa" },

                    { value: "commercial", label: "Commercial" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>
            </div>

            <div className="register-field">
              <label>Currency</label>

              <div className="register-input">
                <CustomDropdown
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  placeholder="Select Currency"
                  options={[
                    { value: "ETB", label: "ETB" },
                    { value: "USD", label: "USD" },
                  ]}
                />
              </div>
            </div>

            <div className="register-field">
              <label>Maximum Budget</label>

              <div className="register-input">
                <input
                  type="number"
                  name="maxBudget"
                  value={formData.maxBudget}
                  onChange={handleChange}
                  placeholder="Maximum"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="register-terms">
          <input type="checkbox" id="agreeTerms" required />

          <label htmlFor="agreeTerms">I agree to the Terms & Conditions</label>
        </div>

        <button type="submit" className="register-button" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="register-footer">
          Already have an account?
          <Link href={loginHref}>Login</Link>
        </div>
      </form>
    </div>
  );
}
