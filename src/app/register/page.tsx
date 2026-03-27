import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/register/register-form";
import { allowedEmailDomainsLabel } from "@/lib/auth/credentials";
import { PublicShell } from "@/components/site-shell";
import { ButtonLink, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { registerUserAction } from "@/features/app/actions";
import { getRegistrationOpen } from "@/lib/auth/registration";
import { getCurrentSessionHomePath, getOptionalSessionUser } from "@/lib/auth/session";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, registrationOpen, resolvedSearchParams] = await Promise.all([
    getOptionalSessionUser(),
    getRegistrationOpen(),
    searchParams,
  ]);

  if (user) {
    redirect(await getCurrentSessionHomePath());
  }

  if (!registrationOpen) {
    redirect("/login");
  }

  const email =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "";
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
  const hasSent = resolvedSearchParams?.sent === "1";

  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <SurfaceCard {...(hasSent ? { className: "flex h-full flex-col" } : {})}>
            <SectionHeader
              eyebrow="注册账号"
              title="先创建账户，再完成邮箱确认。"
              description={`当前仅支持 ${allowedEmailDomainsLabel} 邮箱。注册成功后，系统会向你的邮箱发送确认邮件。`}
            />
            {hasSent ? (
              <div className="flex flex-1 items-center">
                <div className="w-full rounded-[28px] border border-[color:var(--status-success)]/22 bg-[color:var(--status-success-bg)] px-6 py-6 text-[color:var(--status-success)]">
                  <p className="text-base leading-8">
                    确认邮件已发送至 {email}。
                  </p>
                  <p className="mt-2 text-base leading-8">
                    请打开邮箱并点击确认链接。确认后，打开该链接的浏览器会跳转至登录页面。若要继续使用当前页面，请返回此页，用邮箱和密码登录。
                  </p>
                </div>
              </div>
            ) : null}
            {!hasSent && error ? (
              <p className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
                {error}
              </p>
            ) : null}
            {!hasSent ? (
              <RegisterForm action={registerUserAction} initialEmail={email} />
            ) : null}
          </SurfaceCard>

          <SurfaceCard className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.28em]">
                注册流程
              </p>
              <div className="mt-4 grid gap-4">
                {[
                  "使用学校邮箱注册，并设置登录密码。",
                  "查收确认邮件并点击激活链接。",
                  "确认成功后，打开确认链接的浏览器会跳转至登录页面。",
                  "若要继续使用当前页面，请返回此页，用邮箱和密码登录。",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="border-border rounded-2xl border p-4"
                  >
                    <p className="text-muted-foreground text-xs">
                      0{index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-7">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/login" tone="soft">
                已有账号，去登录
              </ButtonLink>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PublicShell>
  );
}
