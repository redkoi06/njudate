import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  getAnnouncements,
  getDashboardData,
  getNotifications,
} from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";
import {
  formatDateTime,
  getCurrentRoundStatusLabel,
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
          description="这里汇总资料、问卷、当前轮次、通知与公告，帮助你快速判断下一步要做什么。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "资料状态",
              value: dashboard.profileCompleted ? "已完善" : "待完善",
            },
            {
              label: "问卷状态",
              value: getQuestionnaireStatusLabel(dashboard.questionnaireStatus),
            },
            {
              label: "本轮参与",
              value: dashboard.hasJoinedCurrentBatch ? "已报名" : "未参与",
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
          <h2 className="text-2xl">当前轮次</h2>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            当前状态：{getCurrentRoundStatusLabel(dashboard.currentRoundStatus)}。
          </p>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            {dashboard.currentRoundStatus === "not_joined"
              ? dashboard.currentBatchLabel
                ? `${dashboard.currentBatchLabel} 已进入当前轮次，你本轮未参与。`
                : "当前还没有可展示的轮次信息。"
              : dashboard.currentRoundStatus === "waiting_result"
                ? `${dashboard.currentBatchLabel ?? "当前轮次"} 已报名，请等待公布结果。`
                : `${dashboard.currentBatchLabel ?? "当前轮次"} 的结果已公布，可前往匹配记录查看。`}
          </p>
          {dashboard.currentRoundStatus !== "result_published" &&
          dashboard.currentBatchDeadline ? (
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              报名截止时间：{formatDateTime(dashboard.currentBatchDeadline)}。
            </p>
          ) : null}
          {dashboard.currentRoundStatus === "result_published" &&
          dashboard.currentBatchResultPublishedAt ? (
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              结果公布时间：
              {formatDateTime(dashboard.currentBatchResultPublishedAt)}。
            </p>
          ) : null}
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
