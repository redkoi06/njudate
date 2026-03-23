"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<"idle" | "complete">("idle");
  const prevPathRef = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    clearTimeout(timerRef.current);
    setState("complete");
    timerRef.current = setTimeout(() => setState("idle"), 400);

    return () => clearTimeout(timerRef.current);
  }, [pathname]);

  if (state === "idle") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "var(--brand)",
        zIndex: 9999,
        pointerEvents: "none",
        animation: "nav-progress-complete 400ms var(--ease-out-soft) forwards",
      }}
    />
  );
}
