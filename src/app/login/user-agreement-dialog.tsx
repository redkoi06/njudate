"use client";

import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import {
  PRIVACY_PAGE_CONTENT,
  USER_AGREEMENT_DIALOG_TITLE,
} from "@/features/legal/content";

export function UserAgreementDialog() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="text-primary font-medium underline decoration-[color:rgba(139,74,82,0.28)] underline-offset-4 transition hover:text-[color:var(--wine-deep)]"
        onClick={() => setOpen(true)}
      >
        《NJU Date用户协议》
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(35,27,28,0.5)] px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/50 bg-[rgba(255,252,250,0.98)] shadow-[0_28px_80px_rgba(31,24,24,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6 border-b border-[color:rgba(139,74,82,0.1)] px-6 pt-6 pb-5 sm:px-8">
              <div>
                <p className="text-muted-foreground text-xs tracking-[0.22em]">
                  用户协议
                </p>
                <h2
                  id={titleId}
                  className="mt-3 text-2xl leading-[1.45] text-[color:var(--wine-deep)] sm:text-[2rem]"
                >
                  {USER_AGREEMENT_DIALOG_TITLE}
                </h2>
              </div>

              <button
                type="button"
                aria-label="关闭用户协议"
                className="text-muted-foreground hover:text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,74,82,0.08)] bg-white/80 transition"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pt-6 pb-7 sm:px-8">
              <p className="text-secondary-foreground/85 text-sm leading-8 sm:text-base">
                {PRIVACY_PAGE_CONTENT.description}
              </p>

              <div className="mt-6 grid gap-4">
                {PRIVACY_PAGE_CONTENT.points.map((item) => (
                  <section
                    key={item}
                    className="rounded-[24px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 px-5 py-4"
                  >
                    <p className="text-sm leading-7 text-[color:var(--text-dark)] sm:text-base">
                      {item}
                    </p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
