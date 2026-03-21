import Link from "next/link";
import type { ReactNode } from "react";

import { signOutAction } from "@/features/app/actions";
import { PUBLIC_NAV_ITEMS, USER_NAV_ITEMS } from "@/lib/site";

import { Badge, BrandMark, Button, ButtonLink } from "./site-ui";

export function PublicShell({
  children,
  signedIn = false,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-border/80 sticky top-0 z-30 border-b bg-[rgba(250,247,244,0.88)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link href="/">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="top-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <ButtonLink href="/app/dashboard" size="sm">
                进入站内
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" size="sm">
                登录 / 注册
              </ButtonLink>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-border/80 mt-12 border-t md:mt-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8">
          <div>
            <BrandMark />
            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-7">
              校内认真匹配平台。通过问卷、固定节奏和明确边界，帮助用户在低打扰环境里建立连接。
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="footer-nav-link">
                {item.label}
              </Link>
            ))}
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
    <div className="min-h-screen">
      <header className="border-border/80 sticky top-0 z-30 border-b bg-[rgba(250,247,244,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/dashboard">
              <BrandMark />
            </Link>
            <Badge>{email}</Badge>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {USER_NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="top-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={signOutAction} data-page-transition="route">
            <Button tone="ghost" size="sm" type="submit">
              退出登录
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
