"use client";

import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthImage from "@/components/auth/AuthImage";
import LoginForm from "@/components/auth/LoginForm";
import AuthFooter from "@/components/auth/AuthFooter";

export default function LoginPage() {
  const searchParams = useSearchParams();

  const propertyId = searchParams.get("propertyId");
  const conversion = searchParams.get("conversion");

  const returnTo = searchParams.get("returnTo") || "";

  return (
    <AuthLayout
      leftContent={<AuthImage />}
      rightContent={
        <div className="auth-form-wrapper">
          <LoginForm
            propertyId={propertyId}
            conversion={conversion}
            returnTo={returnTo}
          />

          <AuthFooter
            text="Don't have an account?"
            linkText="Create Account"
            href={
              propertyId
                ? `/register?propertyId=${propertyId}&conversion=${conversion}&returnTo=${encodeURIComponent(returnTo)}`
                : "/register"
            }
          />
        </div>
      }
    />
  );
}
