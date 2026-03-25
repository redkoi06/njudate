import { Badge, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getAdminDashboardData } from "@/features/admin/data";
import { formatDateTime } from "@/lib/site";

function MetricCard({
  label,
  value,
  hint,
}: {
  hint?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-2xl">{value}</p>
      {hint ? (
        <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">{hint}</p>
      ) : null}
    </div>
  );
}

export default async function AdminPage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="后台总览"
          title="平台运营主看板"
          description="这里汇总当前问卷、当前批次、最近一次跑批和近期操作日志，帮助你快速判断平台是否处于正常运营状态。"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="当前用户数"
            value={String(dashboard.users.total)}
            hint={`近 30 天新增 ${dashboard.users.createdInLast30Days} 人`}
          />
          <MetricCard
            label="当前已发布问卷"
            value={
              dashboard.currentQuestionnaire.versionNo
                ? `V${dashboard.currentQuestionnaire.versionNo}`
                : "暂无"
            }
            hint={
              dashboard.currentQuestionnaire.versionNo
                ? `已提交 ${dashboard.currentQuestionnaire.completionCount} 人，填写率 ${dashboard.currentQuestionnaire.completionRate}%`
                : "当前还没有已发布问卷。"
            }
          />
          <MetricCard
            label="当前批次"
            value={dashboard.currentBatch.label ?? "暂无"}
            hint={
              dashboard.currentBatch.label
                ? `状态 ${dashboard.currentBatch.status ?? "未知"}，报名截止 ${formatDateTime(dashboard.currentBatch.signupEndAt)}`
                : "当前没有进行中的批次。"
            }
          />
          <MetricCard
            label="最近运行状态"
            value={dashboard.runStatus.status ?? "暂无"}
            hint={
              dashboard.runStatus.lastErrorMessage
                ? dashboard.runStatus.lastErrorMessage
                : dashboard.runStatus.label
                  ? `最近运行批次：${dashboard.runStatus.label}`
                  : "还没有可展示的运行记录。"
            }
          />
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <h2 className="text-2xl">当前批次时间点</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="报名截止"
              value={formatDateTime(dashboard.currentBatch.signupEndAt)}
            />
            <MetricCard
              label="匹配计算"
              value={formatDateTime(dashboard.currentBatch.matchRunAt)}
            />
            <MetricCard
              label="结果发布"
              value={formatDateTime(dashboard.currentBatch.resultPublishAt)}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-2xl">最近一次已发布批次</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MetricCard
              label="批次名称"
              value={dashboard.lastPublishedBatch.label ?? "暂无"}
            />
            <MetricCard
              label="结果概况"
              value={
                dashboard.lastPublishedBatch.label
                  ? `匹配 ${dashboard.lastPublishedBatch.matchedCount} / 未匹配 ${dashboard.lastPublishedBatch.unmatchedCount}`
                  : "暂无"
              }
            />
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl">最近公告</h2>
            {dashboard.latestAnnouncement ? (
              <Badge tone={dashboard.latestAnnouncement.status === "published" ? "success" : "soft"}>
                {dashboard.latestAnnouncement.status}
              </Badge>
            ) : null}
          </div>
          <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
            {dashboard.latestAnnouncement?.title ?? "当前还没有公告。"}
          </p>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-2xl">最近操作日志</h2>
          <div className="mt-5 grid gap-3">
            {dashboard.recentOperationLogs.length > 0 ? (
              dashboard.recentOperationLogs.map((log) => (
                <div key={log.id} className="border-border rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">{log.actionType}</p>
                    <Badge>{log.actorRole}</Badge>
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {log.entityType} / {log.entityId ?? "无实体"} /{" "}
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-secondary-foreground/80 text-sm leading-7">
                还没有操作日志。
              </p>
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
