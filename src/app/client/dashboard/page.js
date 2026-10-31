"use client";

import ClientHero from "@/components/client/ClientHero";
import ClientPropertySection from "@/components/client/ClientPropertySection";
import ClientNearbyProperties from "@/components/client/ClientNearbyProperties";
import ClientPaymentOverview from "@/components/client/ClientPaymentOverview";
import "@/styles/client/dashboard.css";
import "@/styles/client/properties.css";
import "@/styles/property.css";

export default function ClientDashboard() {
  return (
    <div className="client-home-page">
      <ClientHero />

      <ClientPropertySection />
      <ClientNearbyProperties />

      <ClientPaymentOverview />
    </div>
  );
}
