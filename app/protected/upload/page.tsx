import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";
import { CaptionUploader } from "../CaptionUploader";

export default async function ProtectedUploadPage() {
  const homeButtonStyle: React.CSSProperties = {
    display: "inline-block",
    border: "1px solid #334155",
    background: "#1e293b",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e2e8f0",
    textDecoration: "none",
    cursor: "pointer",
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
        gap: "12px",
        padding: "20px 40px 32px",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Upload Image</h1>
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 12,
          marginTop: -4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={homeButtonStyle} className="protected-hover-button">
            Home
          </Link>
          <Link
            href="/protected?order=likes_desc&featured=false&publicOnly=true"
            style={homeButtonStyle}
            className="protected-hover-button"
          >
            Vote Captions
          </Link>
          <Link href="/protected/upload" style={homeButtonStyle} className="protected-hover-button">
            Upload Image
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
          <p style={{ margin: 0, color: "#94a3b8", textAlign: "right" }}>Signed in as {user.email ?? "Google user"}</p>
          <AuthControls isSignedIn variant="protected" />
        </div>
      </div>

      <CaptionUploader />
    </main>
  );
}
