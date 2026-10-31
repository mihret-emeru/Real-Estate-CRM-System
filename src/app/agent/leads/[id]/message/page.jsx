"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AgentLeadMessagePage() {
  const params = useParams();
  const router = useRouter();

  const leadId = params?.id;

  const [error, setError] = useState("");

  useEffect(() => {
    if (!leadId) return;

    let cancelled = false;

    async function openConversation() {
      try {
        const response = await fetch(
          `/api/agent/leads/${leadId}/conversation`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (cancelled) return;

        if (!response.ok || !result.success) {
          setError(result.message || "Unable to open the conversation.");
          return;
        }

        if (result.conversationId) {
          router.replace(`/agent/messages/${result.conversationId}`);
          return;
        }

        // The lead may not have a property-linked conversation yet.
        router.replace("/agent/messages");
      } catch {
        if (!cancelled) {
          setError("Unable to connect. Please try again.");
        }
      }
    }

    openConversation();

    return () => {
      cancelled = true;
    };
  }, [leadId, router]);

  if (error) {
    return (
      <div className="agent-lead-message-error">
        <h2>Unable to open conversation</h2>
        <p>{error}</p>
        <Link href="/agent/messages">Go to Messages</Link>
      </div>
    );
  }

  return <LoadingSpinner message="Opening conversation..." />;
}
