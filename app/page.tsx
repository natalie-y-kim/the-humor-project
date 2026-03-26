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
        fontFamily: 'Georgia, "Times New Roman", serif',
        background:
          "radial-gradient(circle at top, rgba(251, 191, 36, 0.18), transparent 28%), linear-gradient(180deg, #111827 0%, #0f172a 48%, #172554 100%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gap: 28, justifyItems: "center" }}>
        <section style={{ width: "100%", maxWidth: 760, display: "grid", gap: 18, justifyItems: "center" }}>
          <p
            style={{
              margin: 0,
              padding: "0.45rem 0.75rem",
              borderRadius: 999,
              border: "1px solid rgba(251, 191, 36, 0.35)",
              background: "rgba(15, 23, 42, 0.44)",
              color: "#fcd34d",
              fontFamily: "system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            EXPERIMENT WITH HUMOR
          </p>
          <div style={{ display: "grid", gap: 14, textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(40px, 7vw, 82px)",
                lineHeight: 0.96,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: "#f8fafc",
              }}
            >
              AI Caption Studio
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "system-ui, sans-serif",
                fontSize: "clamp(20px, 3vw, 30px)",
                lineHeight: 1.2,
                fontWeight: 500,
                color: "#e2e8f0",
              }}
            >
              Generate funnier captions, test different angles, and find the one that lands.
            </p>
            <p
              style={{
                margin: "0 auto",
                maxWidth: 620,
                fontFamily: "system-ui, sans-serif",
                fontSize: 17,
                lineHeight: 1.6,
                color: "#cbd5e1",
              }}
            >
              Upload an image, explore multiple humor directions, and refine captions with a faster creative workflow.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {["Fast ideation", "Multiple humor angles", "Built for experimentation"].map((item) => (
              <span
                key={item}
                style={{
                  padding: "0.55rem 0.9rem",
                  borderRadius: 999,
                  background: "rgba(148, 163, 184, 0.14)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#e2e8f0",
                  fontSize: 14,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>
        <section
          style={{
            width: "100%",
            maxWidth: 540,
            border: "1px solid rgba(226, 232, 240, 0.22)",
            borderRadius: 24,
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.96) 100%)",
            padding: "1.75rem",
            display: "grid",
            gap: 18,
            boxShadow: "0 24px 80px rgba(15, 23, 42, 0.32)",
            backdropFilter: "blur(12px)",
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
              <div style={{ display: "grid", gap: 8 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 28,
                    lineHeight: 1.05,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    color: "#0f172a",
                  }}
                >
                  Sign in to get started.
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: "#475569",
                  }}
                >
                  Use Google to save experiments, compare variations, and keep refining what works.
                </p>
              </div>
              <AuthControls isSignedIn={false} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
