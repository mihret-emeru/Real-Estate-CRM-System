import Image from "next/image";

export default function AuthImage() {
  return (
    <div className="auth-image-container">
      <Image
        src="/images/login-property.jpg"
        alt="Luxury property"
        fill
        className="auth-background"
      />

      <div className="auth-overlay">
        <Image
          src="/images/logo.png"
          alt="Real Estate CRM Logo"
          width={150}
          height={150}
          className="auth-logo"
          priority
          unoptimized
        />

        <h1>Real Estate CRM</h1>

        <p>
          Manage properties, clients, leads, and sales from one powerful
          platform.
        </p>

        <span>Trusted property management solution</span>
      </div>
    </div>
  );
}
