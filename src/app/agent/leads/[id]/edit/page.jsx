"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaSave } from "react-icons/fa";

import CustomDropdown from "@/components/common/CustomDropdown";
import "@/styles/agent/lead-edit.css";

export default function AgentLeadEditPage() {
  const params = useParams();
  const router = useRouter();

  const [lead, setLead] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadLead() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/leads/${params.id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load lead.");
        }

        setLead(result.data);
        setStatus(result.data.status || "new");
        setNotes(result.data.notes || "");
      } catch (error) {
        console.error("Failed to load lead:", error);

        setError(error.message || "Failed to load lead.");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/agent/leads/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update lead.");
      }

      setSuccess("Lead updated successfully.");

      setLead(result.data);

      setTimeout(() => {
        router.push(`/agent/leads/${params.id}`);
      }, 800);
    } catch (error) {
      console.error("Failed to update lead:", error);

      setError(error.message || "Failed to update lead.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="agent-lead-edit-page">
        <div className="agent-lead-edit-state">
          <p>Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="agent-lead-edit-page">
        <div className="agent-lead-edit-state">
          <h2>Unable to Load Lead</h2>
          <p>{error}</p>

          <Link href="/agent/leads" className="agent-lead-edit-back">
            <FaArrowLeft />
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-lead-edit-page">
      <div className="agent-lead-edit-top">
        <Link
          href={`/agent/leads/${params.id}`}
          className="agent-lead-edit-back"
        >
          <FaArrowLeft />
          Back to Lead
        </Link>
      </div>

      <div className="agent-lead-edit-header">
        <div>
          <span>LEAD MANAGEMENT</span>

          <h1>Update Lead</h1>

          <p>Update the lead status and keep your notes current.</p>
        </div>
      </div>

      <form className="agent-lead-edit-form" onSubmit={handleSubmit}>
        <section className="agent-lead-edit-card">
          <div className="agent-lead-edit-card-header">
            <div>
              <span>LEAD INFORMATION</span>
              <h2>{lead?.fullName}</h2>
            </div>
          </div>

          <div className="agent-lead-edit-readonly">
            <div>
              <span>Email</span>
              <strong>{lead?.email || "-"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{lead?.phone || "-"}</strong>
            </div>

            <div>
              <span>Source</span>
              <strong>{lead?.source || "-"}</strong>
            </div>

            <div>
              <span>Property</span>
              <strong>
                {lead?.interestedProperty?.title || "No property"}
              </strong>
            </div>
          </div>
        </section>

        <section className="agent-lead-edit-card">
          <div className="agent-lead-edit-card-header">
            <div>
              <span>FOLLOW-UP</span>
              <h2>Lead Progress</h2>
            </div>
          </div>

          <div className="agent-lead-edit-field">
            <label>Lead Status</label>

            <CustomDropdown
              value={status}
              onChange={setStatus}
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

          <div className="agent-lead-edit-field">
            <label>Notes</label>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write notes about your follow-up with this lead..."
              rows={7}
            />
          </div>
        </section>

        {error && <div className="agent-lead-edit-message error">{error}</div>}

        {success && (
          <div className="agent-lead-edit-message success">{success}</div>
        )}

        <div className="agent-lead-edit-actions">
          <Link
            href={`/agent/leads/${params.id}`}
            className="agent-lead-edit-cancel"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="agent-lead-edit-save"
            disabled={saving}
          >
            <FaSave />

            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

