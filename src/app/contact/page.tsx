import { PublicShell } from "@/components/site-shell";
import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getOptionalSessionUser } from "@/lib/auth/session";

export default async function ContactPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)} activePublicNavHref="/contact">
      <section className="mx-auto max-w-4xl px-5 pb-10 pt-14 md:px-8 md:pb-12">
        <div className="grid gap-6">
          <SurfaceCard>
            <SectionHeader
              eyebrow="联系我们"
              title="联系NJU Date Team的唯一方式"
              description="任何有关问题，反馈，建议，或者想和NJU Date Team聊聊……"
            />
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-2xl">联系方式</h2>
            <div className="text-secondary-foreground/80 mt-5 grid gap-3 text-sm leading-7">
              <p className="border-border rounded-2xl border p-4">
                邮箱：njudate_official@163.com
                小红书账号：NJUDate_official
              </p>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PublicShell>
  );
}
