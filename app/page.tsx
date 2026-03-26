import Link from "next/link";
import { AuthControls } from "@/app/auth-controls";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/app/theme-toggle";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="landing-page">
      <div className="landing-layout">
        <section className="landing-hero">
          <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <ThemeToggle />
          </div>
          <p className="landing-badge">GENERATE & RATE CAPTIONS</p>
          <div className="landing-copy">
            <h1 className="landing-title">AI Caption Studio</h1>
            <p className="landing-subtitle">Create funnier captions and see what actually lands.</p>
            <p className="landing-supporting">
              Upload an image, generate captions, and explore what others find funny across newest, most liked, and
              featured posts.
            </p>
          </div>
          <div className="landing-pill-row">
            {["Caption generation", "Vote on captions", "Discover top posts"].map((item) => (
              <span key={item} className="landing-pill">
                {item}
              </span>
            ))}
          </div>
        </section>
        <section className="landing-card">
          {user ? (
            <>
              <p className="landing-card-text">You are signed in as {user.email ?? "Google user"}.</p>
              <div className="flex items-center gap-2.5">
                <Link className="landing-primary-link" href="/protected?order=likes_desc&featured=false&publicOnly=true">
                  Go to Studio
                </Link>
                <AuthControls isSignedIn />
              </div>
            </>
          ) : (
            <>
              <div className="landing-card-copy">
                <p className="landing-card-title">Sign in to start creating and voting.</p>
                <p className="landing-card-text">Save your captions, vote on posts, and come back anytime.</p>
              </div>
              <div className="landing-card-panel">
                <AuthControls isSignedIn={false} />
                <p className="landing-caption">Your captions and votes will be saved to your account.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
