import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";
import { CaptionUploader } from "../CaptionUploader";
import { ThemeToggle } from "@/app/theme-toggle";

export default async function ProtectedUploadPage() {
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
  const homeButtonStyle: React.CSSProperties = {
    display: "inline-block",
    border: "1px solid var(--border-strong)",
    background: "transparent",
    borderRadius: 999,
    padding: "8px 12px",
    color: "var(--text-muted)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 400,
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "18px",
        padding: "20px 40px 32px",
        background: "var(--shell-bg)",
        color: "var(--text-primary)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gap: 8,
          paddingBottom: 4,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--accent-strong)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Create
        </p>
        <div style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.05 }}>
            Upload an image and generate captions
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 15, lineHeight: 1.5 }}>
            Start with one image, generate options, and review the strongest caption directions.
          </p>
        </div>
      </div>
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
            <Link
              href="/"
              style={{
                ...homeButtonStyle,
                color: "var(--text-muted)",
              }}
              className="protected-hover-button"
            >
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
                style={{
                  ...navButtonStyle,
                  padding: "10px 12px 12px",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  borderRadius: 0,
                  background: "transparent",
                  color: "var(--text-muted)",
                  boxShadow: "none",
                }}
                className="protected-hover-button"
              >
                Discover
              </Link>
              <Link
                href="/protected/upload"
                style={{
                  ...navButtonStyle,
                  ...activeNavButtonStyle,
                  padding: "10px 12px 12px",
                  border: "none",
                  borderBottom: "2px solid var(--accent-strong)",
                  borderRadius: 0,
                  background: "transparent",
                  color: "var(--accent-text)",
                  boxShadow: "none",
                }}
                className="protected-hover-button"
              >
                Create
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
            <ThemeToggle />
            <p style={{ margin: 0, color: "var(--text-muted)", textAlign: "right", fontSize: 14 }}>
              Signed in as {user.email ?? "Google user"}
            </p>
            <AuthControls isSignedIn variant="protected" />
          </div>
        </div>
      </div>

      <CaptionUploader />
    </main>
  );
}
