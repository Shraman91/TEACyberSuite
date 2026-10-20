"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRedirect({
  to,
  delayMs = 1500,
}: {
  to: string;
  delayMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => router.replace(to), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, router, to]);

  return null;
}

