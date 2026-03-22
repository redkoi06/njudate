"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function GlobalPageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const el = contentRef.current;
    if (!el) {
      return;
    }

    el.classList.remove("page-entered");
    void el.offsetWidth;
    el.classList.add("page-entered");
  }, [pathname]);

  return (
    <div ref={contentRef} className="page-transition-content">
      {children}
    </div>
  );
}
