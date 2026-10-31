"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LeadForm from "@/components/leads/LeadForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";
import Link from "next/link";

export default function EditLeadPage() {
  const { id } = useParams();
  const router = useRouter();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLead() {
      try {
        const response = await fetch(`/api/leads/${id}`);
        const data = await response.json();

        if (data.success) {
          setLead(data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchLead();
    }
  }, [id]);

  async function handleUpdateLead(formData) {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/manager/leads/${id}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) return <LoadingSpinner message="Loading lead..." />;

  if (!lead) return <h2>Lead not found.</h2>;

  return (
    <div className="edit-lead-page">
      <div className="page-title">
        <BackLink href="/manager/leads" label="Back to Leads" />
        <h1>Edit Lead</h1>
        <p>Update lead information</p>
      </div>
      <div className="lead-form-card">
        <LeadForm
          initialData={lead}
          onSubmit={handleUpdateLead}
          submitText="Update Lead"
        />
      </div>
    </div>
  );
}
