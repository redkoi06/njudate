import { Fragment } from "react";

import { PublicShell } from "@/components/site-shell";
import { SurfaceCard } from "@/components/site-ui";
import {
  type LegalRichText,
  PRIVACY_PAGE_CONTENT,
} from "@/features/legal/content";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function RichText({
  segments,
  as: Component = "p",
  className,
}: {
  segments: LegalRichText;
  as?: "p" | "h1" | "h2";
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
                "underline decoration-[color:rgba(139,74,82,0.36)] underline-offset-[0.28em]",
            )}
          >
            {segment.text}
          </span>
        </Fragment>
      ))}
    </Component>
  );
}

export default async function PrivacyPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)} activePublicNavHref="/privacy">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(240,230,232,0.92),transparent_68%)]" />

        <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-12 md:px-8 md:pt-14 md:pb-16">
          <div className="grid gap-6">
            <SurfaceCard className="overflow-hidden border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(250,243,244,0.88))] p-0">
              <div className="grid gap-8 px-6 py-7 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1.55fr)_20rem] lg:items-start">
                <div>
                  <p className="text-muted-foreground text-xs tracking-[0.28em]">
                    {PRIVACY_PAGE_CONTENT.eyebrow}
                  </p>
                  <RichText
                    as="h1"
                    segments={PRIVACY_PAGE_CONTENT.titleSegments}
                    className="mt-4 text-[2rem] leading-[1.35] text-[color:var(--text-dark)] md:text-[2.8rem]"
                  />
                  <RichText
                    segments={PRIVACY_PAGE_CONTENT.introSegments}
                    className="text-secondary-foreground/85 mt-5 max-w-3xl text-sm leading-8 md:text-base"
                  />
                </div>

                <div className="rounded-[28px] border border-[color:rgba(139,74,82,0.12)] bg-white/78 p-5 shadow-[0_18px_42px_rgba(31,24,24,0.08)]">
                  <RichText
                    segments={PRIVACY_PAGE_CONTENT.summaryTitle}
                    className="text-sm leading-7 text-[color:var(--wine-deep)]"
                  />
                  <div className="mt-4 grid gap-3">
                    {PRIVACY_PAGE_CONTENT.summaryItems.map((item) => (
                      <div
                        key={item.description
                          .map((segment) => segment.text)
                          .join("")}
                        className="rounded-2xl border border-[color:rgba(139,74,82,0.1)] bg-[rgba(250,247,244,0.9)] px-4 py-3"
                      >
                        <RichText
                          segments={item.title}
                          className="text-sm leading-7 text-[color:var(--text-dark)]"
                        />
                        <RichText
                          segments={item.description}
                          className="text-secondary-foreground mt-1 text-sm leading-7"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <div className="grid gap-5">
              {PRIVACY_PAGE_CONTENT.sections.map((section, index) => (
                <article
                  key={section.id}
                  className="overflow-hidden rounded-[30px] border border-[color:rgba(160,122,58,0.22)] bg-[linear-gradient(180deg,rgba(251,244,232,0.96),rgba(255,255,255,0.96))] shadow-[0_18px_40px_rgba(31,24,24,0.06)]"
                >
                  <div className="grid gap-5 px-6 py-6 md:px-8 md:py-7 lg:grid-cols-[5rem_minmax(0,1fr)] lg:items-start">
                    <div className="flex items-center gap-3 lg:block">
                      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[rgba(139,74,82,0.1)] text-base font-semibold text-[color:var(--wine-deep)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground text-xs tracking-[0.2em] lg:mt-3 lg:block">
                        协议章节
                      </span>
                    </div>

                    <div>
                      <RichText
                        as="h2"
                        segments={section.title}
                        className="text-2xl leading-[1.45] text-[color:var(--text-dark)]"
                      />
                      <div className="mt-5 grid gap-4">
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                          <div
                            key={`${section.id}-${paragraphIndex}`}
                            className="rounded-[24px] border border-[color:rgba(139,74,82,0.08)] bg-white/72 px-4 py-4 md:px-5"
                          >
                            <RichText
                              segments={paragraph}
                              className="text-secondary-foreground/90 text-sm leading-8 md:text-[0.98rem]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
