"use client";

import { useSearchParams } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import "@/styles/register.css";

export default function RegisterPage() {
  const searchParams = useSearchParams();

  const propertyId = searchParams.get("propertyId");
  const conversion = searchParams.get("conversion");
  const returnTo = searchParams.get("returnTo") || "";

  return (
    <div className="register-page">
      <RegisterForm
        propertyId={propertyId}
        conversion={conversion}
        returnTo={returnTo}
      />
    </div>
  );
}
