export default function AuthLayout({ leftContent, rightContent }) {
  return (
    <div className="auth-container">
      <div className="auth-left">{leftContent}</div>
      <svg
        className="auth-divider"
        viewBox="0 0 180 1000"
        preserveAspectRatio="none"
      >
        <path
          d="
      M180 0
      C60 30, 0 160, 40 350
      C75 480, 75 520, 40 650
      C0 840, 60 970, 180 1000
      L180 1000
      L180 0
      Z
    "
        />
      </svg>

      <div className="auth-right">{rightContent}</div>
    </div>
  );
}
