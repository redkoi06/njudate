"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import type { HomeFaqItem } from "./content";

type CountdownSegment = {
  label: string;
  value: string;
};

function createEmptyCountdownSegments(): CountdownSegment[] {
  return [
    { label: "天", value: "00" },
    { label: "时", value: "00" },
    { label: "分", value: "00" },
    { label: "秒", value: "00" },
  ];
}

function getCountdownSegments(targetAt: string | null, now: number) {
  if (!targetAt) {
    return createEmptyCountdownSegments();
  }

  const remaining = Math.max(new Date(targetAt).getTime() - now, 0);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return [
    { label: "天", value: days.toString().padStart(2, "0") },
    { label: "时", value: hours.toString().padStart(2, "0") },
    { label: "分", value: minutes.toString().padStart(2, "0") },
    { label: "秒", value: seconds.toString().padStart(2, "0") },
  ] satisfies CountdownSegment[];
}

export function HomeScrollButton({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-controls={targetId}
      onClick={() => {
        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }

        const headerOffset = 32;
        const startY = window.scrollY;
        const targetY = Math.max(
          target.getBoundingClientRect().top + startY - headerOffset,
          0,
        );
        const distance = targetY - startY;
        if (Math.abs(distance) < 1) {
          return;
        }

        const durationMs = 520;
        const startAt = performance.now();

        const step = (now: number) => {
          const progress = Math.min((now - startAt) / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          window.scrollTo(0, startY + distance * eased);

          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };

        window.requestAnimationFrame(step);
      }}
    >
      {children}
    </button>
  );
}

export function HomeCountdown({ targetAt }: { targetAt: string | null }) {
  const [segments, setSegments] = useState<CountdownSegment[]>(
    createEmptyCountdownSegments,
  );

  useEffect(() => {
    const update = () => {
      setSegments(getCountdownSegments(targetAt, Date.now()));
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [targetAt]);

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="rounded-[28px] border border-[color:rgba(139,74,82,0.1)] bg-white/82 px-4 py-5 text-center backdrop-blur"
        >
          <span
            key={`${segment.label}-${segment.value}`}
            className="home-countdown-digit block font-serif text-4xl text-[color:var(--wine-deep)] sm:text-5xl"
          >
            {segment.value}
          </span>
          <span className="text-muted-foreground mt-2 block text-xs tracking-[0.28em]">
            {segment.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HomeFaqAccordion({ items }: { items: HomeFaqItem[] }) {
  const [openQuestion, setOpenQuestion] = useState<string>("");

  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:rgba(139,74,82,0.12)] bg-white/82 backdrop-blur-xl">
      {items.map((item, index) => {
        const isOpen = item.question === openQuestion;

        return (
          <div
            key={item.question}
            className={cn(
              "border-[color:rgba(139,74,82,0.08)]",
              index !== items.length - 1 ? "border-b" : "",
            )}
          >
            <button
              type="button"
              className={cn(
                "group flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition duration-300 md:px-8",
                isOpen
                  ? "bg-[color:rgba(139,74,82,0.05)] text-[color:var(--wine-deep)]"
                  : "text-foreground hover:bg-[color:rgba(139,74,82,0.04)] hover:text-[color:var(--wine-deep)]",
              )}
              aria-expanded={isOpen}
              onClick={() =>
                setOpenQuestion((current) =>
                  current === item.question ? "" : item.question,
                )
              }
            >
              <span className="text-base leading-7 md:text-lg">
                {item.question}
              </span>
              <ChevronDown
                size={18}
                className={cn(
                  "shrink-0 transition duration-300",
                  isOpen ? "rotate-180 text-[color:var(--wine-deep)]" : "",
                )}
              />
            </button>

            <div
              className={cn(
                "grid px-6 transition-[grid-template-rows,opacity,padding-top,padding-bottom] duration-300 ease-out md:px-8",
                isOpen
                  ? "grid-rows-[1fr] pt-5 pb-5 opacity-100"
                  : "grid-rows-[0fr] pt-0 pb-0 opacity-0",
              )}
            >
              <div className="overflow-hidden pr-8">
                <p className="text-secondary-foreground/85 text-sm leading-7 md:text-base">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
