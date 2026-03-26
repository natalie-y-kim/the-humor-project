"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoAdvanceOnVoteProps = {
  enabled: boolean;
  nextHref: string | null;
  delayMs?: number;
};

export function AutoAdvanceOnVote({
  enabled,
  nextHref,
  delayMs = 450,
}: AutoAdvanceOnVoteProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !nextHref) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push(nextHref);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, enabled, nextHref, router]);

  return null;
}
