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
      }}
    >
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
        <h1 style={{ margin: 0 }}>Route Access Gate</h1>
        {user ? (
          <>
            <p style={{ margin: 0 }}>You are signed in as {user.email ?? "Google user"}.</p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/protected">Open protected route</Link>
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
    </main>
  );
}
