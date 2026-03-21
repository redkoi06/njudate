import { PublicShell } from "@/components/site-shell";
import { Badge, Button, Field, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { requestOtpAction, verifyOtpAction } from "@/features/app/actions";
import { getSessionUser } from "@/lib/auth/session";
import { SCHOOL_EMAIL_DOMAIN } from "@/lib/site";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([
    getSessionUser(),
    searchParams,
  ]);
  const sentEmail =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : "";
  const hasSent = resolvedSearchParams?.sent === "1";

  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <SurfaceCard>
            <SectionHeader
              eyebrow="校内登录"
              title="先用学校邮箱获取一次性验证码。"
              description={`当前仅支持 ${SCHOOL_EMAIL_DOMAIN} 邮箱。验证码验证成功后，平台会自动创建或补全你的站内账号。`}
              action={hasSent && sentEmail ? <Badge>{sentEmail}</Badge> : null}
            />
            <form action={requestOtpAction} className="mt-8 grid gap-5">
              <Field
                name="email"
                label="学校邮箱"
                type="email"
                defaultValue={sentEmail}
                required
              />
              <div className="flex justify-end">
                <Button type="submit">发送验证码</Button>
              </div>
            </form>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              eyebrow="验证码登录"
              title="收到验证码后，在这里完成登录。"
              description="输入成功后会直接进入站内主页。若没有收到邮件，请先确认学校邮箱填写是否正确。"
            />
            <form action={verifyOtpAction} className="mt-8 grid gap-5">
              <Field
                name="email"
                label="学校邮箱"
                type="email"
                defaultValue={sentEmail}
                required
              />
              <Field
                name="token"
                label="6 位验证码"
                inputMode="numeric"
                maxLength={6}
                required
              />
              <div className="flex justify-end">
                <Button type="submit">验证并登录</Button>
              </div>
            </form>
          </SurfaceCard>
        </div>
      </section>
    </PublicShell>
  );
}
