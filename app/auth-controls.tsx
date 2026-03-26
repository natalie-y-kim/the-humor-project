"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type AuthControlsProps = {
  isSignedIn: boolean;
  variant?: "default" | "protected";
};

export function AuthControls({ isSignedIn, variant = "default" }: AuthControlsProps) {
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
    const isProtectedVariant = variant === "protected";
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={isSubmitting}
        className={
          isProtectedVariant
            ? "auth-button-protected protected-hover-button"
            : "auth-button-secondary protected-hover-button"
        }
      >
        {isSubmitting ? "Signing out..." : "Sign out"}
      </button>
    );
  }

  return (
    <button type="button" onClick={signInWithGoogle} className="auth-button-default">
      Sign in with Google
    </button>
  );
}
