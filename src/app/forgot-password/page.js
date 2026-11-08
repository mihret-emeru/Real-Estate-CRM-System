"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthImage from "@/components/auth/AuthImage";
import { FaEnvelope } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to process your request.");
      }

      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      leftContent={<AuthImage />}
      rightContent={
        <div className="auth-form-wrapper">
          <div className="login-form-container">
            <div className="heading-line"></div>

            <h1>Forgot Password?</h1>

            <p>
              Enter your registered email address. We'll send you a password
              reset link if an account exists.
            </p>

            {message && <div className="login-success">{message}</div>}

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address</label>

                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />

                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "22px" }}>
              <Link href="/login">Back to Login</Link>
            </div>
          </div>
        </div>
      }
    />
  );
}
