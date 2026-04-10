import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaptionUploader } from "../CaptionUploader";
import { ProtectedHeader } from "../ProtectedHeader";

export default async function ProtectedUploadPage() {
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
      <ProtectedHeader activeTab="create" userEmail={user.email} />

      <CaptionUploader />
    </main>
  );
}
