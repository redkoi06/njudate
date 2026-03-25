import Link from "next/link";

import { EmptyState, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { getMatchRecords } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";
import { formatDateTime, getMatchStatusLabel } from "@/lib/site";

export default async function MatchesPage() {
  const user = await requireAppUser();
  const records = await getMatchRecords(user.id);

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="匹配记录"
          title="查看历次结果与当前状态"
          description="只有与你自己相关的结果会出现在这里。匹配成功后，可以进入详情页查看理由与联系入口。"
        />
      </SurfaceCard>
      {records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => (
            <SurfaceCard key={record.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-muted-foreground text-xs tracking-[0.2em]">
                    {record.batchLabel}
                  </p>
                  <h2 className="mt-2 text-2xl">
                    {getMatchStatusLabel(record.status)}
                  </h2>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {record.previewText ?? "当前还没有可展示的预览信息。"}
                  </p>
                </div>
                <div className="text-sm">
                  <p>匹配得分：{record.score ?? "待公布"}</p>
                  <p className="mt-2">
                    发布时间：{formatDateTime(record.releasedAt)}
                  </p>
                  <p className="mt-2">
                    查看状态：{record.viewedAt ? "已查看" : "未查看"}
                  </p>
                  <Link
                    href={`/app/matches/${record.id}`}
                    className="text-primary mt-4 inline-block"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="还没有匹配记录"
          description="当本周结果公布后，你可以在这里查看历次批次的结果。"
        />
      )}
    </div>
  );
}
