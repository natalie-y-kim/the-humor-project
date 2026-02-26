"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type AuthControlsProps = {
  isSignedIn: boolean;
};

export function AuthControls({ isSignedIn }: AuthControlsProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    setIsSubmitting(true);
    try {
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={isSubmitting}
        style={{
          border: "1px solid #cbd5e1",
          background: "white",
          borderRadius: 8,
          padding: "10px 14px",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.75 : 1,
        }}
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      style={{
        border: "1px solid #2563eb",
        background: "#2563eb",
        color: "white",
        borderRadius: 8,
        padding: "10px 14px",
        cursor: "pointer",
      }}
    >
      Sign in with Google
    </button>
  );
}
