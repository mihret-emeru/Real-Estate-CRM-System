import Image from "next/image";

export default function AuthImage() {
  return (
    <div className="auth-image-container">
      <Image
        src="/images/login-property.png"
        alt="Luxury property"
        width={1000}
        height={1000}
        className="auth-background"
        priority
        unoptimized
      />
    </div>
  );
}
