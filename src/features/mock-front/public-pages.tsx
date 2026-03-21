"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HeartHandshake,
  Info,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  ABOUT_SECTIONS,
  BRAND_NAME,
  CONTACT_FORM_SCHEMA,
  CONTACT_SUBJECTS,
  HOME_COMMITMENTS,
  HOME_COUNTDOWN_TARGET_ISO,
  HOME_FAQ,
  HOME_FEATURES,
  HOME_HERO,
  HOME_PLACEHOLDER_PHOTO,
  HOME_STATS,
  HOME_STEPS,
  LOGIN_EMAIL_SCHEMA,
  NEXT_MATCH_TIME_LABEL,
  PRIVACY_SECTIONS,
} from "@/features/mock-front/data";
import { useDemoApp } from "@/features/mock-front/provider";
import {
  ActionButton,
  ActionLink,
  BrandLogo,
  SectionHeader,
  SurfaceCard,
  TextAreaField,
  TextField,
} from "@/features/mock-front/ui";
import { cn } from "@/lib/utils";
import type { ContactFormInput } from "@/features/mock-front/types";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useDemoApp();
  const shellPrimaryHref =
    state.role === "guest"
      ? "/login"
      : state.role === "admin"
        ? "/admin"
        : "/app/dashboard";
  const shellPrimaryLabel = state.role === "guest" ? "登录 / 注册" : "进入站内";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(240,230,232,0.95),transparent_28%),linear-gradient(180deg,#faf7f4_0%,#fffdfb_100%)]">
      <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/">
            <BrandLogo compact />
          </Link>

          <div className="flex items-center gap-5">
            <Link
              href="/about"
              className={
                pathname === "/about"
                  ? "top-nav-link top-nav-link-active text-sm"
                  : "top-nav-link text-sm"
              }
            >
              关于
            </Link>
            <ActionLink
              href={shellPrimaryHref}
              tone="neutral"
              size="sm"
              className="btn btn-primary"
            >
              {shellPrimaryLabel}
            </ActionLink>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-border mt-24 border-t bg-[color:var(--cream-warm)]/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 md:px-8 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <BrandLogo subtitle="面向校内用户的认真匹配平台" />
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              {BRAND_NAME}{" "}
              只做校园内、低打扰、重边界的连接体验。没有公开广场，也没有无限滑动。
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
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
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.18em]">
                说明
              </p>
              <div className="text-secondary-foreground mt-4 space-y-2.5 text-sm">
                <p>固定匹配时间：每周二晚</p>
                <p>数据仅用于匹配与运营必要场景</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

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

function getCountdownSegments(targetISO: string, now: number): CountdownSegment[] {
  const remaining = Math.max(new Date(targetISO).getTime() - now, 0);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return [
    { label: "天", value: days.toString().padStart(2, "0") },
    { label: "时", value: hours.toString().padStart(2, "0") },
    { label: "分", value: minutes.toString().padStart(2, "0") },
    { label: "秒", value: seconds.toString().padStart(2, "0") },
  ];
}

function HomeCountdown({ targetISO }: { targetISO: string }) {
  const [segments, setSegments] = useState<CountdownSegment[]>(
    createEmptyCountdownSegments,
  );

  useEffect(() => {
    const update = () => {
      setSegments(getCountdownSegments(targetISO, Date.now()));
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [targetISO]);

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

function HomeFaqAccordion() {
  const [openQuestion, setOpenQuestion] = useState<string>("");

  return (
    <div className="overflow-hidden rounded-[32px] border border-[color:rgba(139,74,82,0.12)] bg-white/82 backdrop-blur-xl">
      {HOME_FAQ.map((item, index) => {
        const isOpen = item.question === openQuestion;

        return (
          <div
            key={item.question}
            className={cn(
              "border-[color:rgba(139,74,82,0.08)]",
              index !== HOME_FAQ.length - 1 ? "border-b" : "",
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
                "grid px-6 transition-[grid-template-rows,opacity,padding-bottom] duration-300 ease-out md:px-8",
                isOpen
                  ? "grid-rows-[1fr] pb-5 opacity-100"
                  : "grid-rows-[0fr] pb-0 opacity-0",
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

export function HomePage() {
  const { state } = useDemoApp();
  const primaryHref =
    state.role === "guest"
      ? "/login"
      : state.role === "admin"
        ? "/admin"
        : "/app/dashboard";
  const primaryLabel = state.role === "guest" ? "立即开始" : "进入站内";
  const featureIcons = [
    Sparkles,
    CalendarClock,
    LockKeyhole,
    ShieldCheck,
  ] as const;
  const commitmentIcons = [ShieldCheck, CalendarClock, HeartHandshake] as const;

  return (
    <div className="pb-6">
      <section className="px-5 pt-8 pb-16 md:px-8 md:pt-10 md:pb-22">
        <div className="mx-auto w-full max-w-7xl">
          <div className="relative min-h-[560px] overflow-hidden rounded-[40px] border border-white/30 bg-[color:rgba(69,42,47,0.28)] shadow-[0_32px_80px_rgba(31,24,24,0.12)] md:min-h-[640px]">
            <Image
              src={HOME_PLACEHOLDER_PHOTO}
              alt="NJU Date 首页首屏占位图"
              fill
              priority
              sizes="100vw"
              className="home-hero-image object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(43,26,29,0.82),rgba(93,55,61,0.52)_48%,rgba(255,248,242,0.16))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,197,161,0.3),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_22%)]" />

            <div className="relative z-10 flex min-h-[560px] items-end p-6 sm:p-8 md:min-h-[640px] md:p-12 lg:p-16">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/10 px-5 py-2 text-sm text-white backdrop-blur-md">
                  <span className="inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.9)]" />
                  <span>{HOME_HERO.participationLabel}</span>
                </div>

                <h1 className="mt-8 max-w-2xl text-4xl leading-[1.16] text-white sm:text-5xl md:text-6xl lg:text-[4.6rem]">
                  {HOME_HERO.title}
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white/84 md:text-lg">
                  {HOME_HERO.subtitle}
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <ActionLink
                    href={primaryHref}
                    tone="neutral"
                    className="btn btn-light border-white/20"
                  >
                    {primaryLabel}
                    <ArrowRight size={16} />
                  </ActionLink>
                  <ActionLink
                    href="/about"
                    tone="neutral"
                    className="btn btn-secondary"
                  >
                    了解平台机制
                  </ActionLink>
                </div>

                <p className="mt-6 text-sm leading-7 text-white/70">
                  {HOME_HERO.caption}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 max-w-5xl text-center">
            <p className="text-muted-foreground text-xs tracking-[0.28em]">
              距下次配对揭晓
            </p>
            <HomeCountdown targetISO={HOME_COUNTDOWN_TARGET_ISO} />
            <p className="text-secondary-foreground/80 mt-6 text-sm">
              {NEXT_MATCH_TIME_LABEL}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOME_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[30px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 px-6 py-7 text-center backdrop-blur"
              >
                <p className="font-serif text-5xl text-[color:var(--wine-deep)]">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm text-foreground">{stat.label}</p>
                <p className="text-muted-foreground mt-2 text-xs leading-6">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-18 md:px-8 md:py-22">
        <SectionHeader
          eyebrow="使用流程"
          title="三步完成一次低打扰的认真相遇"
          description="流程被刻意压缩得很短，但每一步都保持清晰。你始终知道自己正在决定什么，以及下一步会发生什么。"
        />

        <div className="mt-12 grid gap-6 xl:grid-cols-3">
          {HOME_STEPS.map((step) => (
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
          <SectionHeader
            eyebrow="Why NJU Date"
            title="为什么值得信任，为什么值得等待"
            description="我们把原则、边界和机制尽量写清楚，不用等到真正开始使用后才发现规则和预期不一致。"
          />

          <div className="mt-12 grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
            <div className="rounded-[34px] border border-[color:rgba(139,74,82,0.1)] bg-white/84 p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[320px] overflow-hidden rounded-[28px]">
                  <Image
                    src={HOME_PLACEHOLDER_PHOTO}
                    alt="Why NJU Date 占位图"
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
                      不是为了制造更多曝光，而是为了减少无意义打扰。
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-xs tracking-[0.28em] text-[color:var(--wine-medium)]">
                      核心原则
                    </p>
                    <p className="text-secondary-foreground/85 mt-4 text-sm leading-8">
                      {BRAND_NAME}
                      只处理四件事：认真理解你、让你自己决定是否参与、在固定时间统一揭晓、只在明确动作后开放有限联系。产品的价值不在于“更快”，而在于“更稳、更清楚、更值得信任”。
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {HOME_COMMITMENTS.map((item, index) => {
                      const Icon =
                        commitmentIcons[index % commitmentIcons.length] ??
                        ShieldCheck;

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
                const Icon =
                  featureIcons[index % featureIcons.length] ?? Sparkles;

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

      <section className="mx-auto w-full max-w-5xl px-5 py-18 md:px-8 md:py-22">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-muted-foreground text-xs tracking-[0.28em]">
            常见问题
          </p>
          <h2 className="mt-3 text-3xl leading-[1.35] md:text-[2.4rem]">
            先确认规则，再决定是否开始
          </h2>
          <p className="text-secondary-foreground/82 mt-4 text-sm leading-7 md:text-base">
            如果规则、节奏和边界都符合你的预期，再进入会更轻松。首页先把最常见的问题展开给你看清楚。
          </p>
        </div>

        <div className="mt-12">
          <HomeFaqAccordion />
        </div>

        <div className="mt-10 flex justify-center">
          <ActionLink
            href={primaryHref}
            tone="neutral"
            className="btn btn-primary"
          >
            {primaryLabel}
            <ArrowRight size={16} />
          </ActionLink>
        </div>
      </section>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-18 md:px-8">
      <SectionHeader
        eyebrow="关于平台"
        title="它不是为了制造更多曝光，而是为了减少无意义打扰"
        description="需求文档要求的平台气质是真诚、温和、克制，我们就按这个方向把前端完整铺开。"
      />
      <div className="mt-12 space-y-10">
        {ABOUT_SECTIONS.map((section) => (
          <SurfaceCard key={section.title}>
            <p className="text-foreground text-lg">{section.title}</p>
            {"paragraphs" in section ? (
              <div className="text-secondary-foreground/80 mt-5 space-y-4 text-sm leading-7">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="text-secondary-foreground/80 mt-5 space-y-3 text-sm leading-7">
                {section.bullets.map((bullet) => (
                  <p key={bullet}>• {bullet}</p>
                ))}
              </div>
            )}
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-18 md:px-8">
      <SectionHeader
        eyebrow="隐私协议"
        title="你的信息只在必要场景中被使用"
        description="正式法务文本后续可以替换，这里先把用户最关心的边界写清楚。"
      />
      <SurfaceCard className="border-primary/15 bg-primary/5 mt-10">
        <p className="text-sm leading-7 text-[color:var(--wine-deep)]">
          简版结论：问卷不会公开给其他普通用户浏览，公开搜索与公开广场都不存在；只有你主动触发联系动作后，平台才会按规则开放有限联系方式。
        </p>
      </SurfaceCard>
      <div className="mt-10 space-y-6">
        {PRIVACY_SECTIONS.map((section) => (
          <SurfaceCard key={section.title}>
            <p className="text-foreground text-lg">{section.title}</p>
            <div className="text-secondary-foreground/80 mt-5 space-y-4 text-sm leading-7">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const [form, setForm] = useState<ContactFormInput>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormInput, string | undefined>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = CONTACT_FORM_SCHEMA.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        subject: fieldErrors.subject?.[0],
        message: fieldErrors.message?.[0],
      });
      return;
    }

    setErrors({});
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-4xl px-5 py-24 md:px-8">
        <SurfaceCard className="mx-auto max-w-xl px-10 py-14 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[color:var(--status-success-bg)] text-[color:var(--status-success)]">
            <CheckCircle2 size={26} />
          </div>
          <p className="text-foreground mt-7 text-2xl">留言已收到</p>
          <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
            我们会优先处理与安全、举报、身份异常相关的问题。一般咨询会在 3
            个工作日内答复。
          </p>
          <div className="mt-8">
            <ActionButton tone="soft" onClick={() => setSubmitted(false)}>
              再写一条
            </ActionButton>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-18 md:px-8">
      <SectionHeader
        eyebrow="联系我们"
        title="有问题、建议或不适反馈，都可以在这里留下"
        description="页面只接收 mock 提交，但表单字段和交互都按第一阶段要求完整保留。"
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <SurfaceCard className="h-fit space-y-6">
          <div>
            <div className="text-foreground flex items-center gap-2 text-sm">
              <Mail size={15} className="text-primary" />
              官方邮箱
            </div>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              support@njudate.local
            </p>
          </div>
          <div>
            <div className="text-foreground flex items-center gap-2 text-sm">
              <MessageSquareText size={15} className="text-primary" />
              回复时效
            </div>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              一般咨询 3 个工作日内，紧急安全问题优先处理。
            </p>
          </div>
          <div className="rounded-[24px] border border-[color:rgba(160,122,58,0.2)] bg-[color:var(--status-warning-bg)] px-5 py-4 text-sm leading-7 text-[color:var(--status-warning)]">
            紧急或高风险问题不要只依赖表单，请同步发送邮件，避免延误。
          </div>
        </SurfaceCard>

        <SurfaceCard className="px-7 py-7">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="称呼"
                placeholder="你希望我们怎么称呼你"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                hint={errors.name}
              />
              <TextField
                label="回复邮箱"
                placeholder="用于接收处理结果"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                hint={errors.email}
              />
            </div>

            <label className="block">
              <span className="text-muted-foreground mb-2 block text-xs tracking-[0.08em]">
                主题
              </span>
              <select
                className="border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-2"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              >
                <option value="">请选择主题</option>
                {CONTACT_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject ? (
                <span className="mt-2 block text-xs leading-6 text-[color:var(--destructive)]">
                  {errors.subject}
                </span>
              ) : null}
            </label>

            <TextAreaField
              label="内容"
              rows={7}
              placeholder="请尽量把问题背景、当前状态和你希望平台协助的方向写清楚。"
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              hint={errors.message}
            />

            <ActionButton type="submit" tone="wine" disabled={loading}>
              {loading ? "提交中…" : "提交留言"}
            </ActionButton>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const { beginEmailVerification, enterAdmin } = useDemoApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = LOGIN_EMAIL_SCHEMA.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "邮箱格式不正确");
      return;
    }

    setError("");
    setLoading(true);
    beginEmailVerification(result.data);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    router.push("/verify");
  };

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-7xl lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="border-border hidden border-r bg-[color:var(--cream-warm)]/80 px-10 py-14 lg:flex lg:flex-col lg:justify-between">
          <BrandLogo subtitle="校园内部认真匹配平台" />
          <div>
            <p className="text-foreground font-serif text-4xl leading-[1.8]">
              先进入，
              <br />
              再决定这一周是否参加。
            </p>
            <div className="text-secondary-foreground/80 mt-8 space-y-3 text-sm leading-7">
              <p>• 仅限学校邮箱</p>
              <p>• 每周二晚统一公布结果</p>
              <p>• 问卷不公开，联系动作有明确后果</p>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            这一步只做 mock 验证，不连接任何后端服务。
          </p>
        </aside>

        <div className="flex items-center justify-center px-5 py-12 md:px-8">
          <SurfaceCard className="w-full max-w-md px-8 py-9">
            <SectionHeader
              eyebrow="登录 / 注册"
              title="用学校邮箱进入"
              description="首次登录会自动创建站内账户，并引导你补齐资料与问卷。"
            />

            <form className="mt-8 space-y-5" onSubmit={submit}>
              <TextField
                label="学校邮箱"
                placeholder="yourname@smail.nju.edu.cn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                hint={error || "当前只校验邮箱格式与后缀，不发真实验证码。"}
              />
              <ActionButton
                type="submit"
                tone="wine"
                disabled={loading || !email}
              >
                {loading ? "发送中…" : "发送验证码"}
                <ArrowRight size={16} />
              </ActionButton>
            </form>

            <div className="border-border mt-6 rounded-[24px] border bg-[color:var(--cream-warm)]/85 px-5 py-4">
              <div className="flex gap-3">
                <Info
                  size={16}
                  className="mt-1 text-[color:var(--wine-medium)]"
                />
                <p className="text-secondary-foreground/80 text-xs leading-6">
                  当前演示版默认接受任意 6
                  位验证码。真实接入会替换成学校邮箱验证码链路。
                </p>
              </div>
            </div>

            <div className="border-border mt-8 border-t pt-6">
              <p className="text-muted-foreground text-center text-xs tracking-[0.18em]">
                演示入口
              </p>
              <div className="mt-4 grid gap-3">
                <ActionButton
                  tone="soft"
                  onClick={() => {
                    beginEmailVerification("demo@smail.nju.edu.cn");
                    router.push("/verify");
                  }}
                >
                  以普通用户进入演示
                </ActionButton>
                <ActionButton
                  tone="soft"
                  onClick={() => {
                    enterAdmin();
                    router.push("/admin");
                  }}
                >
                  以管理员进入演示
                </ActionButton>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

export function VerifyPage() {
  const router = useRouter();
  const { state, completeEmailVerification } = useDemoApp();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const email = state.pendingEmail || "yourname@smail.nju.edu.cn";

  const updateCode = (index: number, value: string) => {
    const next = [...code];
    next[index] = value.replace(/\D/g, "").slice(-1);
    setCode(next);
    setError("");
  };

  const verify = async () => {
    const joined = code.join("");
    if (joined.length !== 6) {
      setError("请输入 6 位验证码");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    completeEmailVerification();
    router.push("/app/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-4xl items-center px-5 py-16 md:px-8">
      <SurfaceCard className="mx-auto w-full max-w-lg px-8 py-10">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition"
        >
          <ArrowLeft size={14} />
          返回登录
        </Link>

        <div className="mt-8">
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            邮箱验证
          </p>
          <h1 className="mt-3 text-3xl leading-[1.4]">输入 6 位验证码</h1>
          <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
            我们已向 <span className="text-foreground">{email}</span>{" "}
            发送了一封验证邮件。演示环境中输入任意 6 位数字都可以继续。
          </p>
        </div>

        <div className="mt-8 grid grid-cols-6 gap-3">
          {code.map((digit, index) => (
            <input
              key={`${digit}-${index}`}
              value={digit}
              onChange={(event) => updateCode(index, event.target.value)}
              inputMode="numeric"
              maxLength={1}
              className="border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 h-14 rounded-2xl border text-center text-lg transition outline-none focus:ring-2"
            />
          ))}
        </div>

        {error ? (
          <p className="mt-3 text-xs leading-6 text-[color:var(--destructive)]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <ActionButton tone="wine" onClick={verify} disabled={loading}>
            {loading ? "验证中…" : "确认进入"}
          </ActionButton>
          <ActionButton tone="soft">重新发送验证码</ActionButton>
        </div>

        <div className="border-border mt-6 flex items-start gap-3 rounded-[24px] border bg-[color:var(--cream-warm)]/85 px-5 py-4">
          <Clock3 size={15} className="mt-1 text-[color:var(--wine-medium)]" />
          <p className="text-secondary-foreground/80 text-xs leading-6">
            验证码有效期在真实接入后默认为 10
            分钟。当前页面只保留交互与版式，不连接邮件系统。
          </p>
        </div>
      </SurfaceCard>
    </div>
  );
}
