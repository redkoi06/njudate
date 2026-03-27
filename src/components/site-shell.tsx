"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import brandMark from "../../icon/icon.png";
import { signOutAction } from "@/features/app/actions";
import { isAuthenticatedNavItemActive } from "@/lib/navigation";
import { ADMIN_NAV_ITEMS, USER_NAV_ITEMS } from "@/lib/site";
import { cn } from "@/lib/utils";

import { BrandMark, Button } from "./site-ui";

const PUBLIC_INFO_NAV_ITEMS = [
  { href: "/about", label: "关于平台" },
  { href: "/privacy", label: "隐私协议" },
  { href: "/contact", label: "联系我们" },
] as const;

function AuthenticatedShellBase({
  children,
  email,
  homeHref,
  navItems,
}: {
  children: ReactNode;
  email: string;
  homeHref: string;
  navItems: readonly { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="border-border/80 sticky top-0 z-30 border-b bg-[rgba(250,247,244,0.9)] backdrop-blur">
        <div className="mx-auto max-w-7xl px-5 py-3 md:px-8 md:py-4">
          <div className="grid gap-3 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center justify-between gap-3 lg:min-w-0 lg:flex-1 lg:justify-start lg:gap-4">
              <Link href={homeHref}>
                <BrandMark />
              </Link>
              <form action={signOutAction} className="lg:hidden">
                <Button
                  tone="ghost"
                  size="sm"
                  type="submit"
                  className="px-3 py-2 text-sm hover:bg-secondary/80"
                >
                  退出登录
                </Button>
              </form>
              <div
                className="border-border/60 bg-card/72 text-muted-foreground hidden max-w-full rounded-full border px-3 py-2 text-xs shadow-[0_10px_24px_rgba(31,24,24,0.04)] lg:block lg:max-w-[18rem] lg:text-sm"
                title={email}
              >
                <span className="block truncate">{email}</span>
              </div>
            </div>
            <div
              className="border-border/60 bg-card/72 text-muted-foreground max-w-full rounded-full border px-3 py-2 text-center text-xs shadow-[0_10px_24px_rgba(31,24,24,0.04)] lg:hidden"
              title={email}
            >
              <span className="block truncate">{email}</span>
            </div>
            <nav className="border-border/70 bg-card/80 grid grid-cols-3 gap-1.5 rounded-[24px] border p-1.5 shadow-[0_16px_34px_rgba(31,24,24,0.06)] backdrop-blur lg:flex lg:flex-wrap lg:items-center lg:justify-end lg:gap-2 lg:rounded-[999px] lg:p-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    isAuthenticatedNavItemActive(pathname, item.href)
                      ? "page"
                      : undefined
                  }
                  className={cn(
                    "inline-flex min-h-10 w-full items-center justify-center rounded-full px-2 py-2 text-[0.95rem] transition lg:min-h-0 lg:w-auto lg:px-4 lg:py-2 lg:text-sm",
                    isAuthenticatedNavItemActive(pathname, item.href)
                      ? "bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(139,74,82,0.18)]"
                      : "text-secondary-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <form action={signOutAction} className="hidden lg:block">
                <Button
                  tone="ghost"
                  size="sm"
                  type="submit"
                  className="w-full justify-center px-4 py-2.5 text-sm hover:bg-secondary/80 lg:w-auto"
                >
                  退出登录
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}

function MarketingBrandMark({
  compact = false,
  subtitle,
}: {
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={brandMark}
        alt=""
        aria-hidden
        className="size-9 rounded-full shadow-[0_12px_24px_rgba(139,74,82,0.2)]"
      />
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

export function PublicShell({
  children,
  signedIn = false,
  activePublicNavHref,
}: {
  children: ReactNode;
  signedIn?: boolean;
  activePublicNavHref?: (typeof PUBLIC_INFO_NAV_ITEMS)[number]["href"];
}) {
  const authAction = signedIn ? (
    <Link
      href="/app"
      className="btn btn-primary inline-flex items-center justify-center px-4 py-2.5 text-sm"
    >
      进入站内
    </Link>
  ) : (
    <Link
      href="/login"
      className="btn btn-primary inline-flex items-center justify-center px-4 py-2.5 text-sm"
    >
      登录 / 注册
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-5 py-4 md:px-8",
            activePublicNavHref
              ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
              : "flex flex-wrap items-center justify-between gap-4",
          )}
        >
          <Link
            href="/"
            className={cn(activePublicNavHref && "md:justify-self-start")}
          >
            <MarketingBrandMark compact />
          </Link>
          {activePublicNavHref ? (
            <>
              <nav className="col-span-2 flex flex-wrap items-center justify-center gap-3 text-sm sm:gap-5 md:col-span-1 md:col-start-2 md:row-start-1">
                {PUBLIC_INFO_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "top-nav-link text-sm",
                      activePublicNavHref === item.href &&
                        "top-nav-link-active",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="col-start-2 row-start-1 flex items-center justify-end justify-self-end md:col-start-3 md:row-start-1 md:justify-self-end">
                {authAction}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-5">
              <Link href="/about" className="top-nav-link text-sm">
                关于
              </Link>
              {authAction}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-border mt-12 border-t bg-[color:var(--cream-warm)]/70 md:mt-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 md:px-8 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <MarketingBrandMark subtitle="共赴一场独一无二的金陵绮梦" />
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              NJU Date：Not just dating tools, but connect the dots.
            </p>
            <p className="text-secondary-foreground/65 mt-2 text-xs leading-6">
              © 2026 NJU Date. All Rights Reserved.
            </p>
          </div>
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.18em]">
                平台
              </p>
              <div className="text-secondary-foreground mt-4 space-y-2.5 text-sm">
                <Link href="/about" className="footer-nav-link block">
                  关于平台
                </Link>
                <Link href="/privacy" className="footer-nav-link block">
                  隐私协议
                </Link>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.18em]">
                帮助
              </p>
              <div className="text-secondary-foreground mt-4 space-y-2.5 text-sm">
                <Link href="/contact" className="footer-nav-link block">
                  联系我们
                </Link>
                <Link href="/login" className="footer-nav-link block">
                  登录入口
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  return (
    <AuthenticatedShellBase
      email={email}
      homeHref="/app/dashboard"
      navItems={USER_NAV_ITEMS}
    >
      {children}
    </AuthenticatedShellBase>
  );
}

export function AdminShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  return (
    <AuthenticatedShellBase
      email={email}
      homeHref="/admin"
      navItems={ADMIN_NAV_ITEMS}
    >
      {children}
    </AuthenticatedShellBase>
  );
}
