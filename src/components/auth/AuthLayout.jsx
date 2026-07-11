export default function AuthLayout({ leftContent, rightContent }) {
  return (
    <div className="auth-container">
      <div className="auth-left">{leftContent}</div>

      <div className="auth-right">{rightContent}</div>
    </div>
  );
}
