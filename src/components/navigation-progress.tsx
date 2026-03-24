"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement | null>(null);
  const initialPathRef = useRef(pathname);

  useEffect(() => {
    const element = progressRef.current;
    if (!element || pathname === initialPathRef.current) return;

    initialPathRef.current = pathname;
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation =
      "nav-progress-complete 400ms var(--ease-out-soft) forwards";
  }, [pathname]);

  return (
    <div
      ref={progressRef}
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
        opacity: 0,
      }}
    />
  );
}
