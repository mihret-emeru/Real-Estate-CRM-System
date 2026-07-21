"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

export default function RegisterForm() {
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,

      [name]: value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
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
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-card">
      <Image
        src="/images/logo.png"
        alt="Real Estate CRM"
        width={55}
        height={55}
        className="register-logo"
      />

      <h1>Create Account</h1>

      <p>Create your client account to access the Real Estate CRM.</p>
      {error && <div className="login-error">{error}</div>}

      <form onSubmit={handleRegister}>
        <div className="register-grid">
          {/* LEFT */}

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

              <div className="register-input">
                <FaPhone />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
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

          {/* RIGHT */}

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
              <label>Preferred City</label>

              <div className="register-input">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Addis Ababa"
                />
              </div>
            </div>

            <div className="register-field">
              <label>Preferred Property Type</label>

              <div className="register-input">
                <select
                  className="property-select"
                  name="preferredPropertyType"
                  value={formData.preferredPropertyType}
                  onChange={handleChange}
                >
                  <option value="">Select Property Type</option>

                  <option value="house">House</option>

                  <option value="apartment">Apartment</option>

                  <option value="villa">Villa</option>

                  <option value="land">Land</option>

                  <option value="commercial">Commercial</option>

                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="register-field">
              <label>Currency</label>

              <div className="register-input">
                <select
                  className="property-select"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option>ETB</option>
                  <option>USD</option>
                </select>
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
          <input type="checkbox" />

          <span>I agree to the Terms & Conditions</span>
        </div>

        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        <div className="register-footer">
          Already have an account?
          <Link href="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}

