import Link from "next/link";

import { FlashToast, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  getAnnouncements,
  getDashboardData,
  getNotifications,
} from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireAppUser(),
    searchParams,
  ]);
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
  const [dashboard, announcements, notifications] = await Promise.all([
    getDashboardData(user.id),
    getAnnouncements().catch(() => []),
    getNotifications(user.id),
  ]);
  const notificationActionClassName =
    "border-border bg-card text-secondary-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm shadow-[0_12px_24px_rgba(31,24,24,0.06)] transition hover:bg-secondary/80 hover:text-foreground";

  return (
    <div className="grid gap-6">
      <FlashToast message={error} />
      <SurfaceCard>
        <SectionHeader
          eyebrow="用户主页"
          title="当前状态总览"
          description="这里汇总资料、问卷、参与状态、通知与公告，帮助你快速判断下一步要做什么。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              label: "资料状态",
              value: dashboard.profileCompleted ? "已完善" : "待完善",
            },
            {
              label: "问卷状态",
              value: dashboard.questionnaireStatusLabel,
              hint: dashboard.questionnaireStatusHint,
            },
            {
              label: "本轮参与",
              value: dashboard.hasJoinedCurrentBatch ? "已报名" : "未参与",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="border-border rounded-2xl border p-4"
            >
              <p className="text-muted-foreground text-xs tracking-[0.2em]">
                {item.label}
              </p>
              <p className="mt-3 text-xl">{item.value}</p>
              {"hint" in item && item.hint ? (
                <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                  {item.hint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">最近通知</h2>
        <div className="mt-5 grid gap-4">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className="border-border rounded-2xl border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.title}</p>
                    <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
                      {item.body}
                    </p>
                  </div>
                  <Link
                    href="/app/matches"
                    className={notificationActionClassName}
                  >
                    立即查看
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-secondary-foreground/80 text-sm leading-7">
              目前还没有站内通知。
            </p>
          )}
        </div>
      </SurfaceCard>

      {announcements.length > 0 ? (
        <SurfaceCard>
          <h2 className="text-2xl">平台公告</h2>
          <div className="mt-5 grid gap-4">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="border-border rounded-2xl border p-4"
              >
                <p className="text-muted-foreground text-xs tracking-[0.2em]">
                  {item.eyebrow}
                </p>
                <p className="mt-2 text-lg">{item.title}</p>
                <p className="text-secondary-foreground/80 mt-2 whitespace-pre-line text-sm leading-7">
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
