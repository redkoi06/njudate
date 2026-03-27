"use client";

import { X } from "lucide-react";
import { Fragment, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import {
  type LegalRichText,
  PRIVACY_PAGE_CONTENT,
  USER_AGREEMENT_DIALOG_TITLE,
} from "@/features/legal/content";
import { cn } from "@/lib/utils";

function RichTextBlock({
  segments,
  as: Component = "p",
  className,
}: {
  segments: LegalRichText;
  as?: "p" | "h2" | "h3" | "span";
  className?: string;
}) {
  return (
    <Component className={className}>
      {segments.map((segment, index) => (
        <Fragment key={`${segment.text}-${index}`}>
          <span
            className={cn(
              segment.bold && "font-semibold text-[color:var(--text-dark)]",
              segment.underline &&
                "underline decoration-[color:rgba(139,74,82,0.3)] underline-offset-[0.22em]",
            )}
          >
            {segment.text}
          </span>
        </Fragment>
      ))}
    </Component>
  );
}

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

  const dialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(35,27,28,0.5)] p-4 backdrop-blur-sm sm:p-6"
            onClick={() => setOpen(false)}
          >
            <div className="grid min-h-[calc(100dvh-2rem)] place-items-center sm:min-h-[calc(100dvh-3rem)]">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-[color:rgba(139,74,82,0.12)] bg-[rgba(255,253,251,0.98)] shadow-[0_24px_64px_rgba(31,24,24,0.18)] sm:max-h-[calc(100dvh-3rem)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 border-b border-[color:rgba(139,74,82,0.1)] px-5 py-4 sm:px-6">
                  <h2
                    id={titleId}
                    className="text-lg leading-7 font-semibold text-[color:var(--text-dark)] sm:text-xl"
                  >
                    {USER_AGREEMENT_DIALOG_TITLE}
                  </h2>

                  <button
                    type="button"
                    aria-label="关闭用户协议"
                    className="text-muted-foreground hover:text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full transition"
                    onClick={() => setOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <article className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                  <div className="mx-auto max-w-3xl text-[13px] leading-7 text-[color:var(--text-secondary)] sm:text-sm">
                    <RichTextBlock
                      segments={PRIVACY_PAGE_CONTENT.introSegments}
                      className="text-[color:var(--text-secondary)]"
                    />

                    <div className="mt-4">
                      <RichTextBlock
                        segments={PRIVACY_PAGE_CONTENT.summaryTitle}
                        className="text-[color:var(--text-dark)]"
                      />
                      <ul className="mt-2 space-y-1.5 pl-5">
                        {PRIVACY_PAGE_CONTENT.summaryItems.map((item) => (
                          <li
                            key={item.description
                              .map((part) => part.text)
                              .join("")}
                          >
                            <RichTextBlock
                              segments={item.title}
                              as="span"
                              className="inline"
                            />
                            <span>：</span>
                            <RichTextBlock
                              segments={item.description}
                              as="span"
                              className="inline"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 space-y-5">
                      {PRIVACY_PAGE_CONTENT.sections.map((section) => (
                        <section key={section.id}>
                          <RichTextBlock
                            segments={section.title}
                            as="h3"
                            className="text-sm leading-7 font-semibold text-[color:var(--text-dark)] sm:text-base"
                          />
                          <div className="mt-1.5 space-y-1.5">
                            {section.paragraphs.map((paragraph, index) => (
                              <RichTextBlock
                                key={`${section.id}-${index}`}
                                segments={paragraph}
                                className="text-[color:var(--text-secondary)]"
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="text-primary font-medium underline decoration-[color:rgba(139,74,82,0.28)] underline-offset-4 transition hover:text-[color:var(--wine-deep)]"
        onClick={() => setOpen(true)}
      >
        {USER_AGREEMENT_DIALOG_TITLE}
      </button>

      {dialog}
    </>
  );
}
