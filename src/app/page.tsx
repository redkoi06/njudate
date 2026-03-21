import { PublicShell } from "@/components/site-shell";
import {
  Badge,
  ButtonLink,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import { getAnnouncements } from "@/features/app/data";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { MATCH_SCHEDULE_TEXT } from "@/lib/site";

const PROCESS_STEPS = [
  "使用学校邮箱注册账号，并设置登录密码。",
  "查收确认邮件，点击链接完成邮箱验证。",
  "完善基础资料并正式提交问卷。",
  "按周决定是否加入当前匹配批次。",
];

const PLATFORM_VALUES = [
  {
    title: "不公开浏览",
    description:
      "没有公开广场，也没有用户搜索，只保留与你自己相关的资料、结果和通知。",
  },
  {
    title: "结果可解释",
    description:
      "匹配结果不仅告诉你有没有，还会给出自然语言理由，帮助你理解为什么会是这个人。",
  },
  {
    title: "联系有边界",
    description:
      "联系动作会开放昵称和校内邮箱，不是轻量点赞。你始终知道自己正在触发什么。",
  },
];

export default async function HomePage() {
  const [user, announcements] = await Promise.all([
    getOptionalSessionUser(),
    getAnnouncements().catch(() => []),
  ]);

  return (
    <PublicShell signedIn={Boolean(user)}>
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard className="overflow-hidden">
            <SectionHeader
              eyebrow="校内认真匹配"
              title="把一次相遇交给认真表达，而不是公开曝光。"
              description="NJU Date 只面向校内用户开放。先完成邮箱注册、资料填写和问卷提交，再按周决定是否加入匹配；结果统一公布，联系动作也只在明确确认后发生。"
              action={<Badge>{MATCH_SCHEDULE_TEXT}</Badge>}
            />
            <div className="mt-8 flex flex-wrap gap-4">
              {user ? (
                <>
                  <ButtonLink href="/app/dashboard">进入站内</ButtonLink>
                  <ButtonLink href="/about" tone="soft">
                    了解平台机制
                  </ButtonLink>
                </>
              ) : (
                <>
                  <ButtonLink href="/register">注册账号</ButtonLink>
                  <ButtonLink href="/login" tone="soft">
                    密码登录
                  </ButtonLink>
                </>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-5">
            <p className="text-muted-foreground text-xs tracking-[0.28em]">
              使用流程
            </p>
            <div className="space-y-4">
              {PROCESS_STEPS.map((item, index) => (
                <div
                  key={item}
                  className="border-border rounded-2xl border p-4"
                >
                  <p className="text-muted-foreground text-xs">0{index + 1}</p>
                  <p className="mt-2 text-sm leading-7">{item}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PLATFORM_VALUES.map((item) => (
            <SurfaceCard key={item.title}>
              <h2 className="text-xl">{item.title}</h2>
              <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                {item.description}
              </p>
            </SurfaceCard>
          ))}
        </div>

        {announcements.length > 0 ? (
          <SurfaceCard>
            <SectionHeader
              eyebrow="平台公告"
              title="当前安排"
              description="重要的匹配时间调整、节假日安排和使用提醒会显示在这里。"
            />
            <div className="mt-6 grid gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="border-border rounded-2xl border p-4"
                >
                  <p className="text-muted-foreground text-xs tracking-[0.2em]">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-2 text-lg">{item.title}</h3>
                  <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        ) : null}
      </section>
    </PublicShell>
  );
}
