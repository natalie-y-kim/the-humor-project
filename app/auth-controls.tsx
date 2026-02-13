"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AuthControlsProps = {
  isSignedIn: boolean;
};

export function AuthControls({ isSignedIn }: AuthControlsProps) {
  const router = useRouter();
  const supabase = createClient();

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  };

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={signOut}
        style={{
          border: "1px solid #cbd5e1",
          background: "white",
          borderRadius: 8,
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        Sign out
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
