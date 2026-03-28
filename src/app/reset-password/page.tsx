import Image from "next/image";
import Link from "next/link";

import loginBrandIcon from "../../../icon/icon.png";
import { allowedEmailDomainsLabel } from "@/lib/auth/credentials";

import { ResetPasswordForm } from "./reset-password-form";

const LOGIN_HERO_IMAGE = "/images/photos/photo_1.jpg";

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen bg-[linear-gradient(180deg,#f8f3ef_0%,#fffdfb_100%)] lg:grid-cols-[minmax(0,1.08fr)_minmax(440px,0.92fr)]">
      <aside className="relative min-h-[320px] overflow-hidden lg:min-h-screen">
        <Image
          src={LOGIN_HERO_IMAGE}
          alt="NJU Date 重置密码页展示图"
          fill
          loading="eager"
          sizes="(min-width: 1024px) 56vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,23,24,0.18),rgba(51,31,34,0.68)_60%,rgba(29,19,20,0.84))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,203,173,0.32),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_22%)]" />

        <div className="relative z-10 flex h-full flex-col justify-start gap-8 px-6 py-6 text-white sm:gap-10 sm:px-8 sm:py-8 lg:justify-between lg:gap-0 lg:px-10 lg:py-10">
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
              NJU CAMPUS NETWALKING
            </p>
            <h1 className="mt-5 text-4xl leading-[1.18] text-white sm:text-5xl lg:text-[4.2rem]">
              重置账户密码
            </h1>
            <p className="mt-6 max-w-md text-[0.98rem] leading-8 text-[rgba(255,245,239,0.9)] sm:text-[1.06rem]">
              请在当前页面设置新的登录密码。完成后，系统会直接带你回到站内。
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
            重置密码
          </h2>
          <p className="text-secondary-foreground/82 mt-4 text-sm leading-7 sm:text-base">
            输入新的登录密码后即可继续访问你的账号。
          </p>

          <ResetPasswordForm />
        </div>
      </main>
    </div>
  );
}
