import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Gauge,
  GraduationCap,
  Link2,
  LockKeyhole,
  ShieldUser,
  SlidersHorizontal,
  TimerReset,
} from "lucide-react";

import homeBrandIcon from "../../../icon/icon.png";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { BRAND_NAME } from "@/lib/site";

import { HomeCountdown, HomeFaqAccordion, HomeScrollButton } from "./client";
import {
  buildHomeSteps,
  HOME_COMMITMENTS,
  HOME_FAQ,
  HOME_FEATURES,
  HOME_PLACEHOLDER_PHOTO,
} from "./content";
import { getHomePageData } from "./data";

const HERO_TITLE = "共赴一场独一无二的金陵绮梦";
const HERO_SUBTITLE =
  "一笺抒怀，静候佳音。待得周中月升，缘起既明，便知何以同舟，何以结契。";
const HERO_CAPTION = "仅限校内邮箱，不公开浏览，亦不无限滑动。每个人都有权利选择让自己舒服的社交方式。";

const featureIcons = [Gauge, SlidersHorizontal, LockKeyhole, Link2] as const;
const commitmentIcons = [GraduationCap, TimerReset, ShieldUser] as const;
const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function HomeBrandLogo({
  compact = false,
  subtitle,
}: {
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src={homeBrandIcon}
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

function HomeSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-xs tracking-[0.28em]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl leading-[1.35] md:text-[2.4rem]">{title}</h2>
      <p className="text-secondary-foreground/82 mx-auto mt-4 max-w-3xl text-sm leading-7 md:text-base">
        {description}
      </p>
    </div>
  );
}

function HomeShell({
  signedIn,
  primaryHref,
  children,
}: {
  signedIn: boolean;
  primaryHref: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(240,230,232,0.95),transparent_28%),linear-gradient(180deg,#faf7f4_0%,#fffdfb_100%)]">
      <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/">
            <HomeBrandLogo compact />
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/about" className="top-nav-link text-sm">
              关于
            </Link>
            <Link
              href={primaryHref}
              className="btn btn-primary inline-flex items-center justify-center px-4 py-2.5 text-sm"
            >
              {signedIn ? "进入站内" : "登录 / 注册"}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-border mt-12 border-t bg-[color:var(--cream-warm)]/70 md:mt-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 md:px-8 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <HomeBrandLogo subtitle="共赴一场独一无二的金陵绮梦" />
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              {BRAND_NAME}
              ：Not just dating tools, but connect the dots.
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

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[30px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 px-6 py-7 text-center backdrop-blur">
      <p className="font-serif text-5xl text-[color:var(--wine-deep)]">{value}</p>
      <p className="text-muted-foreground mt-2 text-xs tracking-[0.28em]">{label}</p>
    </div>
  );
}

export default async function HomePage() {
  const user = await getOptionalSessionUser();
  const homeData = await getHomePageData(Boolean(user));
  const steps = buildHomeSteps();

  return (
    <HomeShell
      signedIn={homeData.signedIn}
      primaryHref={homeData.primaryHref}
    >
      <div>
        <section className="px-5 pt-8 pb-16 md:px-8 md:pt-10 md:pb-22">
          <div className="mx-auto w-full max-w-7xl">
            <div className="relative min-h-[560px] overflow-hidden rounded-[40px] border border-white/30 bg-[color:rgba(69,42,47,0.28)] shadow-[0_32px_80px_rgba(31,24,24,0.12)] md:min-h-[640px]">
              <Image
                src={HOME_PLACEHOLDER_PHOTO}
                alt="NJU Date 首页首屏展示图"
                fill
                loading="eager"
                sizes="100vw"
                className="home-hero-image object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(43,26,29,0.82),rgba(93,55,61,0.52)_48%,rgba(255,248,242,0.16))]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,197,161,0.3),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_22%)]" />

              <div className="relative z-10 flex min-h-[560px] items-end p-6 sm:p-8 md:min-h-[640px] md:p-12 lg:p-16">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/10 px-5 py-2 text-sm text-white backdrop-blur-md">
                    <span className="inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />
                    <span>
                      七日之内，共策青骢者已逾 {formatCount(homeData.currentBatchParticipants)}{" "}
                      人
                    </span>
                  </div>

                  <h1 className="mt-8 max-w-2xl text-4xl leading-[1.16] text-white sm:text-5xl md:text-6xl lg:text-[4.6rem]">
                    {HERO_TITLE}
                  </h1>

                  <p className="mt-6 max-w-2xl text-base leading-8 text-white/84 md:text-lg">
                    {HERO_SUBTITLE}
                  </p>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      href={homeData.primaryHref}
                      className="btn btn-light border-white/20 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm"
                    >
                      {homeData.primaryLabel}
                      <ArrowRight size={16} />
                    </Link>
                    <HomeScrollButton
                      targetId="home-steps"
                      className="btn btn-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm"
                    >
                      了解平台机制
                    </HomeScrollButton>
                  </div>

                  <p className="mt-6 text-sm leading-7 text-white/70">
                    {HERO_CAPTION}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-auto mt-14 max-w-5xl text-center">
              <p className="text-muted-foreground text-xs tracking-[0.28em]">
                距下次配对揭晓
              </p>
              <HomeCountdown targetAt={homeData.countdownTargetAt} />
            </div>

            <p className="text-muted-foreground mx-auto mt-6 block w-fit rounded-full border border-[color:rgba(139,74,82,0.12)] bg-white/76 px-4 py-1 text-center text-xs leading-6 tracking-[0.08em]">
              {homeData.matchScheduleText}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard
                value={formatCount(homeData.registeredUsers)}
                label="已注册用户"
              />
              <StatCard
                value={`${homeData.questionnaireCompletionRate}%`}
                label="问卷完成率"
              />
              <StatCard
                value={formatCount(homeData.matchedUsers)}
                label="成功配对人数"
              />
            </div>
          </div>
        </section>

        <section
          id="home-steps"
          className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 pt-8 pb-18 md:px-8 md:pt-12 md:pb-22"
        >
          <HomeSectionHeader
            eyebrow="使用流程"
            title="想收到青鸾带来的信笺，只需先静下心来理解自己。"
            description="没有浪费时间的复杂流程，无须主动让渡选择权。跟随自己的本心，剩下的交给时间和青鸾。"
          />

          <div className="mt-12 grid gap-6 xl:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="home-float-card group overflow-hidden rounded-[32px] border border-[color:rgba(139,74,82,0.1)] bg-white/86 shadow-[0_26px_56px_rgba(31,24,24,0.06)]"
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={HOME_PLACEHOLDER_PHOTO}
                    alt={`${step.title} 占位图`}
                    fill
                    sizes="(min-width: 1280px) 33vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(37,22,25,0.12),rgba(37,22,25,0.72))]" />
                  <div className="absolute inset-x-6 bottom-6">
                    <p className="font-serif text-sm tracking-[0.32em] text-white/74">
                      {step.number}
                    </p>
                    <p className="mt-3 text-2xl text-white">{step.title}</p>
                  </div>
                </div>

                <div className="px-6 pt-5 pb-6">
                  <p className="text-secondary-foreground/85 text-sm leading-7">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-border/70 border-y bg-[linear-gradient(180deg,rgba(245,240,238,0.8),rgba(255,253,251,0.96))]">
          <div className="mx-auto w-full max-w-7xl px-5 py-18 md:px-8 md:py-22">
            <HomeSectionHeader
              eyebrow="WHY NJU DATE"
              title="原子化时代的深度社交解决方案"
              description="以下是我们的原则，愿景和边界："
            />

            <div className="mt-12 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
              <div className="rounded-[34px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[320px] overflow-hidden rounded-[28px]">
                    <Image
                      src={HOME_PLACEHOLDER_PHOTO}
                      alt="Why NJU Date 展示图"
                      fill
                      sizes="(min-width: 1280px) 32vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,24,28,0.06),rgba(44,24,28,0.78))]" />
                    <div className="absolute inset-x-5 bottom-5 text-white">
                      <p className="text-xs tracking-[0.28em] text-white/72">
                        WHY NJU DATE
                      </p>
                      <p className="mt-3 font-serif text-3xl leading-[1.45]">
                        减少无意义的打扰，选择适合自己的相处方式。
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-xs tracking-[0.28em] text-[color:var(--wine-medium)]">
                        我们的愿景：
                      </p>
                      <p className="text-secondary-foreground/85 mt-4 text-sm leading-8">
                        {BRAND_NAME}
                        只做好一件事：让两个有趣的灵魂相遇。我们衷心希望：帮助你认真理解自己、将参与的选择权交给你、在固定时间统一揭晓、只在彻底确认后开放有限联系。产品的价值不在于“更快”，而在于“更自然、更自主、更值得信任”。
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {HOME_COMMITMENTS.map((item, index) => {
                        const Icon =
                          commitmentIcons[index % commitmentIcons.length] ??
                          ShieldUser;

                        return (
                          <div
                            key={item.title}
                            className="flex items-start gap-4 rounded-[24px] border border-[color:rgba(139,74,82,0.08)] bg-[color:rgba(250,247,244,0.8)] px-4 py-4"
                          >
                            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-2xl">
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm text-foreground">
                                {item.title}
                              </p>
                              <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {HOME_FEATURES.map((feature, index) => {
                  const Icon = featureIcons[index % featureIcons.length] ?? Gauge;

                  return (
                    <div
                      key={feature.title}
                      className="rounded-[30px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 px-6 py-6 backdrop-blur"
                    >
                      <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                        <Icon size={18} />
                      </div>
                      <p className="mt-6 text-lg text-foreground">
                        {feature.title}
                      </p>
                      <p className="text-secondary-foreground/82 mt-4 text-sm leading-7">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pt-18 pb-10 md:px-8 md:pt-22 md:pb-12">
          <HomeSectionHeader
            eyebrow="常见问题"
            title="子曰：“不患人之不己知，患不知人也。”（《论语·学而》）"
            description="如果原则，边界和愿景都符合你的预期，以下是对常见问题的说明。"
          />

          <div className="mt-12">
            <HomeFaqAccordion items={HOME_FAQ} />
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={homeData.primaryHref}
              className="btn btn-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm"
            >
              {homeData.primaryLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </HomeShell>
  );
}
