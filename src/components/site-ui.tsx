"use client";

import Image from "next/image";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import brandMark from "../../icon/icon.png";
import { cn } from "@/lib/utils";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={brandMark}
        alt=""
        aria-hidden
        className="size-10 rounded-full shadow-[0_12px_24px_rgba(139,74,82,0.2)]"
      />
      <div className="min-w-0">
        <p className="text-foreground font-serif text-sm tracking-[0.32em]">
          NJU DATE
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          校内认真匹配平台
        </p>
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
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-muted-foreground text-xs tracking-[0.28em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl leading-[1.4] md:text-[2rem]">{title}</h1>
        {description ? (
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function sharedButtonClasses({
  tone,
  size,
  className,
}: {
  tone: "primary" | "soft" | "ghost";
  size: "sm" | "md";
  className?: string | undefined;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border text-sm transition disabled:cursor-not-allowed disabled:opacity-50",
    tone === "primary" &&
      "border-transparent bg-primary text-primary-foreground shadow-[0_16px_30px_rgba(139,74,82,0.18)]",
    tone === "soft" && "border-border bg-card text-foreground",
    tone === "ghost" &&
      "border-border bg-transparent text-secondary-foreground hover:text-foreground",
    size === "md" ? "px-5 py-3" : "px-4 py-2.5 text-xs",
    className,
  );
}

export function Button({
  tone = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "soft" | "ghost";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={sharedButtonClasses({ tone, size, className })}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  tone = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "primary" | "soft" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={sharedButtonClasses({ tone, size, className })}
    >
      {children}
    </Link>
  );
}

export function Badge({
  children,
  tone = "soft",
}: {
  children: ReactNode;
  tone?: "soft" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs",
        tone === "soft" && "bg-muted text-muted-foreground",
        tone === "success" &&
          "bg-[color:var(--status-success-bg)] text-[color:var(--status-success)]",
        tone === "warning" &&
          "bg-[color:var(--status-warning-bg)] text-[color:var(--status-warning)]",
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <input
        className={cn(
          "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-2",
          error &&
            "border-[color:var(--status-warning)] focus:border-[color:var(--status-warning)] focus:ring-[color:var(--status-warning)]/15",
          className,
        )}
        {...props}
        aria-invalid={error ? true : props["aria-invalid"]}
      />
      {hint || error ? (
        <span
          className={cn(
            "mt-2 block text-xs leading-6",
            error
              ? "text-[color:var(--status-warning)]"
              : "text-muted-foreground",
          )}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
        {label}
      </span>
      <textarea
        className={cn(
          "border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 min-h-28 w-full rounded-3xl border px-4 py-3 text-sm leading-7 transition outline-none focus:ring-2",
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
}: SelectHTMLAttributes<HTMLSelectElement> & {
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
    <SurfaceCard className="py-12 text-center">
      <p className="text-foreground text-lg">{title}</p>
      <p className="text-secondary-foreground/80 mx-auto mt-3 max-w-xl text-sm leading-7">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </SurfaceCard>
  );
}
