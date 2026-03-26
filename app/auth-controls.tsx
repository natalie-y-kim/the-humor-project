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
        className={isProtectedVariant ? "protected-hover-button" : undefined}
        style={{
          border: isProtectedVariant ? "1px solid #334155" : "1px solid #cbd5e1",
          background: isProtectedVariant ? "#1e293b" : "white",
          color: isProtectedVariant ? "#e2e8f0" : "inherit",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: isProtectedVariant ? 16 : undefined,
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
        width: "100%",
        border: "1px solid rgba(30, 41, 59, 0.08)",
        background: "linear-gradient(135deg, #fcd34d 0%, #fbbf24 55%, #f59e0b 100%)",
        color: "#1f2937",
        borderRadius: 14,
        padding: "14px 18px",
        fontFamily: "system-ui, sans-serif",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: "-0.01em",
        boxShadow: "0 16px 32px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.28)",
        cursor: "pointer",
      }}
    >
      Sign in with Google
    </button>
  );
}
