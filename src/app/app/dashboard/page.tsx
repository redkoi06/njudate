import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  getAnnouncements,
  getDashboardData,
  getNotifications,
} from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";
import {
  formatDateTime,
  getMatchStatusLabel,
  getQuestionnaireStatusLabel,
} from "@/lib/site";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const [dashboard, announcements, notifications] = await Promise.all([
    getDashboardData(user.id),
    getAnnouncements().catch(() => []),
    getNotifications(user.id),
  ]);

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="用户主页"
          title="当前状态总览"
          description="这里汇总资料、问卷、报名、结果和通知状态，帮助你快速判断下一步要做什么。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "资料状态",
              value: dashboard.profileCompleted ? "已完成" : "待完善",
            },
            {
              label: "问卷状态",
              value: getQuestionnaireStatusLabel(dashboard.questionnaireStatus),
            },
            {
              label: "本周参与",
              value: dashboard.hasJoinedCurrentBatch ? "已报名" : "未报名",
            },
            {
              label: "未读通知",
              value: `${dashboard.unreadNotificationCount} 条`,
            },
          ].map((item) => (
            <div key={item.label} className="border-border rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs tracking-[0.2em]">
                {item.label}
              </p>
              <p className="mt-3 text-xl">{item.value}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard>
          <h2 className="text-2xl">当前批次</h2>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            {dashboard.currentBatchLabel
              ? `${dashboard.currentBatchLabel} 正在进行中，报名截止时间为 ${formatDateTime(dashboard.currentBatchDeadline)}。`
              : "当前没有开放中的匹配批次。"}
          </p>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            最近一次匹配结果状态：{getMatchStatusLabel(dashboard.latestMatchStatus)}。
          </p>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-2xl">最近通知</h2>
          <div className="mt-5 grid gap-4">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div key={item.id} className="border-border rounded-2xl border p-4">
                  <p className="text-sm">{item.title}</p>
                  <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
                    {item.body}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-secondary-foreground/80 text-sm leading-7">
                目前还没有站内通知。
              </p>
            )}
          </div>
        </SurfaceCard>
      </div>

      {announcements.length > 0 ? (
        <SurfaceCard>
          <h2 className="text-2xl">平台公告</h2>
          <div className="mt-5 grid gap-4">
            {announcements.map((item) => (
              <div key={item.id} className="border-border rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs tracking-[0.2em]">
                  {item.eyebrow}
                </p>
                <p className="mt-2 text-lg">{item.title}</p>
                <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
