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
              title="当前版本不再提供站内工单入口。"
              description="这里仅保留联系说明与使用边界。如果你遇到高风险、线下安全或紧急求助问题，请优先使用你更可靠的线下渠道。"
            />
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-2xl">联系说明</h2>
            <div className="text-secondary-foreground/80 mt-5 grid gap-3 text-sm leading-7">
              <p className="border-border rounded-2xl border p-4">
                平台不再接收站内咨询工单，也不再提供数据导出申请或工单式删号入口。
              </p>
              <p className="border-border rounded-2xl border p-4">
                如需停止使用，请登录后前往设置页，按二次确认流程直接删除账号。
              </p>
              <p className="border-border rounded-2xl border p-4">
                如遇现实风险、骚扰、心理压力或其他需要即时处理的情况，请直接联系你信任的老师、同学、辅导员或校内线下支持渠道。
              </p>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PublicShell>
  );
}
