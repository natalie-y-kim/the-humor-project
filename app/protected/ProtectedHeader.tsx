import Link from "next/link";
import { AuthControls } from "@/app/auth-controls";
import { ThemeToggle } from "@/app/theme-toggle";

export function ProtectedHeader({
  activeTab,
  userEmail,
}: {
  activeTab: "discover" | "create" | "history";
  userEmail: string | null | undefined;
}) {
  const navButtonStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 16px",
    border: "1px solid rgba(251, 191, 36, 0.42)",
    borderRadius: 14,
    background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 55%, #f59e0b 100%)",
    color: "var(--accent-text)",
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: "0 12px 28px rgba(245, 158, 11, 0.24)",
  };
  const activeNavButtonStyle: React.CSSProperties = {
    border: "1px solid rgba(253, 230, 138, 0.7)",
    background: "linear-gradient(135deg, #fde68a 0%, #fcd34d 52%, #f59e0b 100%)",
    color: "var(--accent-text)",
    boxShadow: "0 14px 34px rgba(245, 158, 11, 0.32)",
  };
  const inactiveNavButtonStyle: React.CSSProperties = {
    ...navButtonStyle,
    padding: "10px 12px 12px",
    border: "none",
    borderBottom: "2px solid transparent",
    borderRadius: 0,
    background: "transparent",
    color: "var(--text-muted)",
    boxShadow: "none",
  };
  const activeButtonStyle: React.CSSProperties = {
    ...navButtonStyle,
    ...activeNavButtonStyle,
    padding: "10px 12px 12px",
    border: "none",
    borderBottom: "2px solid var(--accent-strong)",
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none",
  };
  const homeButtonStyle: React.CSSProperties = {
    display: "inline-block",
    border: "1px solid var(--border-strong)",
    background: "transparent",
    borderRadius: 999,
    padding: "8px 12px",
    color: "var(--text-muted)",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 400,
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 980,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={homeButtonStyle} className="protected-hover-button">
            Home
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "2px",
              borderBottom: "1px solid var(--border-strong)",
            }}
          >
            <Link
              href="/protected?order=likes_desc&featured=false&publicOnly=true"
              style={activeTab === "discover" ? activeButtonStyle : inactiveNavButtonStyle}
              className="protected-hover-button"
            >
              Discover
            </Link>
            <Link
              href="/protected/upload"
              style={activeTab === "create" ? activeButtonStyle : inactiveNavButtonStyle}
              className="protected-hover-button"
            >
              Create
            </Link>
            <Link
              href="/protected/archive"
              style={activeTab === "history" ? activeButtonStyle : inactiveNavButtonStyle}
              className="protected-hover-button"
            >
              History
            </Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <ThemeToggle />
          <p style={{ margin: 0, color: "var(--text-muted)", textAlign: "right", fontSize: 14 }}>
            Signed in as {userEmail ?? "Google user"}
          </p>
          <AuthControls isSignedIn variant="protected" />
        </div>
      </div>
    </div>
  );
}
