import { PublicShell } from "@/components/site-shell";
import { Badge, Button, Field, SectionHeader, SurfaceCard, TextArea } from "@/components/site-ui";
import { createContactRequestAction } from "@/features/app/actions";
import { getSessionUser } from "@/lib/auth/session";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([
    getSessionUser(),
    searchParams,
  ]);
  const submitted = resolvedSearchParams?.submitted === "1";

  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="mx-auto max-w-4xl px-5 py-14 md:px-8">
        <SurfaceCard>
          <SectionHeader
            eyebrow="联系我们"
            title="遇到问题、反馈建议，或者想补充说明，都可以从这里提交。"
            description="这里适合咨询、建议、问题反馈和一般性说明；如果是紧急或高风险问题，请同步使用你更可靠的线下渠道。"
            action={submitted ? <Badge tone="success">已提交</Badge> : null}
          />
          <form action={createContactRequestAction} className="mt-8 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field name="senderName" label="称呼" required />
              <Field
                name="senderEmail"
                label="可回复邮箱"
                type="email"
                defaultValue={user?.email ?? ""}
                required
              />
            </div>
            <Field name="topic" label="主题" required />
            <TextArea name="message" label="内容" required />
            <div className="flex justify-end">
              <Button type="submit">提交咨询</Button>
            </div>
          </form>
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
