import Link from "next/link";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "#0f172a",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900, display: "grid", gap: 24, justifyItems: "center" }}>
        <h1
          style={{
            margin: 0,
            marginTop: -18,
            width: "100%",
            fontSize: "clamp(32px, 8vw, 80px)",
            lineHeight: 1.05,
            fontWeight: 500,
            color: "#e2e8f0",
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          AI Caption Studio
        </h1>
        <section
          style={{
            width: "100%",
            maxWidth: 540,
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            background: "white",
            padding: "1.5rem",
            display: "grid",
            gap: 14,
          }}
        >
          {user ? (
            <>
              <p style={{ margin: 0 }}>You are signed in as {user.email ?? "Google user"}.</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Link href="/protected?order=likes_desc&featured=false&publicOnly=true">Open protected route</Link>
                <AuthControls isSignedIn />
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: 0 }}>Sign in with Google to continue.</p>
              <AuthControls isSignedIn={false} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
