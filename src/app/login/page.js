import AuthLayout from "@/components/auth/AuthLayout";
import AuthImage from "@/components/auth/AuthImage";
import LoginForm from "@/components/auth/LoginForm";
import AuthFooter from "@/components/auth/AuthFooter";

export default function LoginPage() {
  return (
    <AuthLayout
      leftContent={<AuthImage />}
      rightContent={
        <div className="auth-form-wrapper">
          <LoginForm />

          <AuthFooter
            text="Don't have an account?"
            linkText="Create Account"
            href="/register"
          />
        </div>
      }
    />
  );
}
