import { PublicShell } from "@/components/site-shell";
import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getOptionalSessionUser } from "@/lib/auth/session";

const PLATFORM_PRINCIPLES = [
  {
    title: "认真表达优先",
    description:
      "问卷不是装饰流程，而是匹配的基础。平台优先理解你的生活节奏、沟通方式和关系期待。",
  },
  {
    title: "固定节奏优先",
    description:
      "是否参加由你按周决定。平台在固定时间统一公布结果，避免持续在线和反复刷新。",
  },
  {
    title: "边界优先",
    description:
      "普通用户不会公开浏览别人。只有在你确认联系后，平台才会开放有限联系方式。",
  },
];

export default async function AboutPage() {
  const user = await getOptionalSessionUser();

  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="mx-auto max-w-5xl px-5 py-14 md:px-8">
        <SurfaceCard className="space-y-10">
          <SectionHeader
            eyebrow="关于平台"
            title="为什么是问卷和按周匹配，而不是公开刷人。"
            description="NJU Date 解决的不是“曝光更多人”，而是给校内用户一个认真、克制、边界清晰的连接入口。"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {PLATFORM_PRINCIPLES.map((item) => (
              <div key={item.title} className="border-border rounded-2xl border p-5">
                <h2 className="text-xl">{item.title}</h2>
                <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </PublicShell>
  );
}
