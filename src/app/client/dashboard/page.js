"use client";

import ClientHero from "@/components/client/ClientHero";
import ClientPropertySection from "@/components/client/ClientPropertySection";
import "@/styles/property.css";

export default function ClientDashboard() {
  return (
    <div className="client-home-page">
      <ClientHero />

      <ClientPropertySection />
    </div>
  );
}
