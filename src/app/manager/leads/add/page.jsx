"use client";

import { useRouter } from "next/navigation";
import LeadForm from "@/components/leads/LeadForm";

export default function AddLeadPage() {
  const router = useRouter();

  async function handleAddLead(formData) {
    try {
      const response = await fetch("/api/leads", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/manager/leads");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="leads-page">
      <div className="page-title">
        <h1>Create Manual Lead</h1>
        <p>Add leads from phone calls, office visits, or referrals</p>
      </div>

      <LeadForm onSubmit={handleAddLead} submitText="Create Lead" />
    </div>
  );
}

