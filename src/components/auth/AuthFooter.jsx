import Link from "next/link";

export default function AuthFooter({ text, linkText, href }) {
  return (
    <div className="auth-footer">
      <p>
        {text} <Link href={href}>{linkText}</Link>
      </p>
    </div>
  );
}
