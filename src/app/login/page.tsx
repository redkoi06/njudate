import { redirect } from "next/navigation";

import { allowedEmailDomainsLabel } from "@/lib/auth/credentials";
import { PublicShell } from "@/components/site-shell";
import {
  Button,
  ButtonLink,
  Field,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import { signInWithPasswordAction } from "@/features/app/actions";
import { getOptionalSessionUser } from "@/lib/auth/session";

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
    <PublicShell>
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10 md:px-8 md:pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <SurfaceCard>
            <SectionHeader
              eyebrow="密码登录"
              title="使用学校邮箱和密码登录。"
              description={`当前仅支持 ${allowedEmailDomainsLabel} 邮箱。若你还没有账号，请先完成注册并验证邮箱。`}
            />
            {error ? (
              <p className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
                {error}
              </p>
            ) : null}
            <form
              action={signInWithPasswordAction}
              className="mt-8 grid gap-5"
              data-page-transition="route"
            >
              <Field
                name="email"
                label="学校邮箱"
                type="email"
                autoComplete="email"
                defaultValue={email}
                required
              />
              <Field
                name="password"
                label="密码"
                type="password"
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end">
                <Button type="submit">登录</Button>
              </div>
            </form>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col justify-between gap-8">
            <div>
              <p className="text-muted-foreground text-xs tracking-[0.28em]">
                还没有账号
              </p>
              <h2 className="mt-3 text-2xl">先完成注册，再用密码登录。</h2>
              <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                注册时需要填写学校邮箱和密码，并通过确认邮件激活账号。激活完成后，后续登录只使用邮箱和密码。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/register">去注册</ButtonLink>
              <ButtonLink href="/about" tone="soft">
                了解平台机制
              </ButtonLink>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PublicShell>
  );
}
