import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import loginBrandIcon from "../../../icon/icon.png";
import { Button, Field } from "@/components/site-ui";
import { signInWithPasswordAction } from "@/features/app/actions";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { allowedEmailDomainsLabel } from "@/lib/auth/credentials";

import { UserAgreementDialog } from "./user-agreement-dialog";

const LOGIN_HERO_IMAGE = "/images/photos/photo_1.jpg";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([
    getOptionalSessionUser(),
    searchParams,
  ]);

  if (user) {
    redirect("/app/dashboard");
  }

  const email =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "";
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <div className="grid min-h-screen bg-[linear-gradient(180deg,#f8f3ef_0%,#fffdfb_100%)] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <aside className="relative min-h-[320px] overflow-hidden lg:min-h-screen">
        <Image
          src={LOGIN_HERO_IMAGE}
          alt="NJU Date 登录页展示图"
          fill
          loading="eager"
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,23,24,0.18),rgba(51,31,34,0.68)_60%,rgba(29,19,20,0.84))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,203,173,0.32),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_22%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-6 text-white sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/8 px-4 py-2 backdrop-blur-sm transition hover:bg-white/14"
            >
              <Image
                src={loginBrandIcon}
                alt=""
                aria-hidden
                className="size-8 rounded-full"
              />
              <span className="font-serif text-sm tracking-[0.24em]">
                NJU DATE
              </span>
            </Link>
          </div>

          <div className="max-w-xl">
            <p className="text-sm tracking-[0.28em] text-white/72">
              CAMPUS MATCHING
            </p>
            <h1 className="mt-5 text-4xl leading-[1.18] text-white sm:text-5xl lg:text-[4.2rem]">
              让一次校内相遇，
              <br />
              值得认真等待。
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/82 sm:text-base">
              只对校内邮箱开放，不公开浏览，不做无限滑动。你先认真填写自己，再按节奏进入一次明确、低打扰的连接。
            </p>
            <p className="mt-6 font-serif text-base tracking-[0.14em] text-[rgba(255,230,211,0.92)] italic sm:text-lg">
              for {allowedEmailDomainsLabel}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-[rgba(255,252,250,0.92)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
        <div className="w-full max-w-md">
          <p className="text-sm tracking-[0.22em] text-[color:var(--wine-medium)]">
            NJU Date
          </p>
          <h2 className="mt-6 text-4xl leading-[1.24] text-[color:var(--wine-deep)]">
            欢迎回来
          </h2>
          <p className="text-secondary-foreground/82 mt-4 text-sm leading-7 sm:text-base">
            使用你的 {allowedEmailDomainsLabel}{" "}
            邮箱和密码登录。首次使用请先注册并完成邮箱确认。
          </p>

          {error ? (
            <p className="mt-6 rounded-[24px] border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm leading-7 text-[color:var(--status-warning)]">
              {error}
            </p>
          ) : null}

          <form
            action={signInWithPasswordAction}
            className="mt-8 grid gap-5"
          >
            <Field
              name="email"
              label="邮箱"
              type="email"
              autoComplete="email"
              defaultValue={email}
              placeholder={`yourname@${allowedEmailDomainsLabel}`}
              className="rounded-[22px] border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base"
              required
            />
            <Field
              name="password"
              label="密码"
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
              className="rounded-[22px] border-[color:rgba(139,74,82,0.14)] bg-[color:rgba(245,241,239,0.84)] px-5 py-4 text-base"
              required
            />

            <div className="text-secondary-foreground/78 flex flex-wrap items-center gap-1 text-sm leading-7">
              <span>登录即代表您已阅读并同意</span>
              <UserAgreementDialog />
            </div>

            <Button
              type="submit"
              className="mt-1 w-full justify-center py-4 text-base shadow-[0_18px_36px_rgba(139,74,82,0.2)]"
            >
              登录
            </Button>
          </form>

          <p className="text-secondary-foreground/78 mt-6 text-center text-sm">
            还没有账号？
            <Link
              href="/register"
              className="text-primary ml-1 font-medium transition hover:text-[color:var(--wine-deep)]"
            >
              立即注册
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
