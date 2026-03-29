import Link from "next/link";

import {
  EmptyState,
  FlashToast,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import { getMatchRecords } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/site";

const detailButtonClassName =
  "border-border bg-card text-secondary-foreground inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm transition hover:bg-secondary/80 hover:text-foreground";

function getHistoryMatchStatusLabel(
  status: "pending" | "matched" | "unmatched" | "error" | "expired",
) {
  switch (status) {
    case "matched":
      return "匹配成功";
    case "unmatched":
      return "未匹配";
    case "pending":
      return "待公布";
    case "error":
      return "结果异常";
    case "expired":
      return "已过期";
  }
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireAppUser(),
    searchParams,
  ]);
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
  const records = await getMatchRecords(user.id);
  const [latestRecord, ...historyRecords] = records;

  return (
    <div className="grid gap-6">
      <FlashToast message={error} />
      <SurfaceCard>
        <SectionHeader
          eyebrow="匹配记录"
          title="查看历次匹配结果"
          description="你可以点击查看详情，了解这次结果与后续说明。"
        />
      </SurfaceCard>
      {latestRecord ? (
        <div className="grid gap-4">
          <div className="px-1">
            <h2 className="text-2xl">最近一次匹配</h2>
          </div>
          <SurfaceCard>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div>
                  <span className="border-border bg-background/80 inline-flex items-center rounded-full border px-5 py-2 font-serif text-2xl tracking-[0.12em] shadow-[0_10px_24px_rgba(31,24,24,0.05)] md:text-[1.9rem]">
                    第 {latestRecord.roundNo} 轮
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 text-sm md:items-end">
                <p>发布时间：{formatDateTime(latestRecord.releasedAt)}</p>
                <Link
                  href={`/app/matches/${latestRecord.id}`}
                  className={detailButtonClassName}
                >
                  查看详情
                </Link>
              </div>
            </div>
          </SurfaceCard>

          {historyRecords.length > 0 ? (
            <>
              <div className="px-1 pt-2">
                <h2 className="text-2xl">历史匹配</h2>
              </div>
              <div className="grid gap-4">
                {historyRecords.map((record) => (
                  <SurfaceCard key={record.id}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-muted-foreground text-xs tracking-[0.2em]">
                          第 {record.roundNo} 轮
                        </p>
                        <h3 className="mt-2 text-2xl">
                          {getHistoryMatchStatusLabel(record.status)}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-4 text-sm md:items-end">
                        <p>发布时间：{formatDateTime(record.releasedAt)}</p>
                        <Link
                          href={`/app/matches/${record.id}`}
                          className={detailButtonClassName}
                        >
                          查看详情
                        </Link>
                      </div>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="还没有匹配记录"
          description="你可以在这里查看历轮结果。"
        />
      )}
    </div>
  );
}
