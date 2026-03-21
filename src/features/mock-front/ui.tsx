"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "wine" | "soft" | "success" | "warning" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  wine: "border-transparent bg-primary text-primary-foreground shadow-[0_16px_30px_rgba(139,74,82,0.18)]",
  soft: "border-border bg-card text-foreground",
  success:
    "border-transparent bg-[color:var(--status-success-bg)] text-[color:var(--status-success)]",
  warning:
    "border-transparent bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning)]",
  info: "border-transparent bg-[color:var(--status-info-bg)] text-[color:var(--status-info)]",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function BrandLogo({
  compact = false,
  subtitle,
}: {
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full text-sm font-medium shadow-[0_12px_24px_rgba(139,74,82,0.2)]">
        宁
      </div>
      <div className="min-w-0">
        <p className="text-foreground font-serif text-sm tracking-[0.32em]">
          NJU DATE
        </p>
        {!compact && subtitle ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card/95 rounded-[28px] border p-6 shadow-[0_18px_38px_rgba(31,24,24,0.06)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-muted-foreground text-xs tracking-[0.28em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl leading-[1.4] md:text-[2rem]">{title}</h1>
        {description ? (
          <p className="text-secondary-foreground/80 mt-3 max-w-xl text-sm leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ActionButton({
  tone = "wine",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border text-sm disabled:cursor-not-allowed disabled:opacity-50",
        toneClasses[tone],
        size === "md" ? "px-5 py-3" : "px-4 py-2.5 text-xs",
        className,
      )}
      {...props}
    />
  );
}

export function ActionLink({
  href,
  children,
  tone = "wine",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border text-sm",
        toneClasses[tone],
        size === "md" ? "px-5 py-3" : "px-4 py-2.5 text-xs",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function StatusBadge({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TinyBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1 text-[11px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TextField({
  label,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <input
        className={cn(
          "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-2",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span className="text-muted-foreground mt-2 block text-xs leading-6">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <select
        className={cn(
          "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-2",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string | undefined;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <textarea
        className={cn(
          "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-3xl border px-4 py-3 text-sm leading-7 transition outline-none focus:ring-2",
          className,
        )}
        {...props}
      />
      {hint ? (
        <span className="text-muted-foreground mt-2 block text-xs leading-6">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-foreground text-sm">{label}</p>
        <p className="text-muted-foreground mt-1 text-xs leading-6">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <SurfaceCard className="py-14 text-center">
      <div className="bg-muted text-muted-foreground mx-auto mb-5 flex size-14 items-center justify-center rounded-full text-lg">
        •
      </div>
      <p className="text-foreground text-base">{title}</p>
      <p className="text-secondary-foreground/80 mx-auto mt-3 max-w-md text-sm leading-7">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </SurfaceCard>
  );
}

export function SimpleBarChart({
  values,
  colors,
}: {
  values: number[];
  colors: string[];
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-44 items-end gap-3">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex flex-1 flex-col items-center"
        >
          <div
            className="w-full rounded-t-2xl transition-all"
            style={{
              height: `${Math.max((value / max) * 100, 6)}%`,
              background: colors[index % colors.length],
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function SimpleLineChart({ values }: { values: number[] }) {
  const width = 320;
  const height = 160;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * 120 - 16;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full overflow-visible"
      fill="none"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,74,82,0.22)" />
          <stop offset="100%" stopColor="rgba(139,74,82,0)" />
        </linearGradient>
      </defs>
      <path
        d={`M0 ${height} L ${points.replace(/ /g, " L ")} L ${width} ${height} Z`}
        fill="url(#lineFill)"
      />
      <polyline
        points={points}
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * 120 - 16;
        return (
          <circle
            key={`${value}-${index}`}
            cx={x}
            cy={y}
            r="4"
            fill="var(--primary)"
          />
        );
      })}
    </svg>
  );
}
