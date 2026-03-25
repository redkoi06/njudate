import { notFound } from "next/navigation";

import { Button, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  markMatchViewedAction,
  triggerMatchContactAction,
} from "@/features/app/actions";
import { getMatchDetail } from "@/features/app/data";
import { PROFILE_SUMMARY_FIELDS } from "@/features/app/profile-contract";
import { requireAppUser } from "@/lib/auth/session";
import {
  formatDateTime,
  getContactStatusLabel,
  getMatchStatusLabel,
} from "@/lib/site";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const [{ matchId }, user] = await Promise.all([params, requireAppUser()]);
  const detail = await getMatchDetail(user.id, matchId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow={detail.batchLabel}
          title={`结果状态：${getMatchStatusLabel(detail.status)}`}
          description={detail.previewText ?? "当前没有额外说明。"}
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs tracking-[0.2em]">匹配得分</p>
            <p className="mt-3 text-2xl">{detail.score ?? "待公布"}</p>
          </div>
          <div className="border-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs tracking-[0.2em]">查看状态</p>
            <p className="mt-3 text-2xl">{detail.viewedAt ? "已查看" : "未查看"}</p>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              发布时间：{formatDateTime(detail.releasedAt)}
            </p>
            {!detail.viewedAt ? (
              <form action={markMatchViewedAction} className="mt-4">
                <input type="hidden" name="matchResultId" value={detail.id} />
                <Button tone="soft" type="submit">
                  标记为已查看
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </SurfaceCard>

      {detail.reasons.length > 0 ? (
        <SurfaceCard>
          <h2 className="text-2xl">匹配理由</h2>
          <div className="mt-5 grid gap-3">
            {detail.reasons.map((reason) => (
              <div
                key={reason}
                className="border-border rounded-2xl border p-4 text-sm leading-7"
              >
                {reason}
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {detail.counterpartSnapshot ? (
        <SurfaceCard>
          <h2 className="text-2xl">对方信息摘要</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {PROFILE_SUMMARY_FIELDS.map((field) => {
              const value = detail.counterpartSnapshot?.[field.key];

              if (value === null || value === undefined || value === "") {
                return null;
              }

              return (
                <div
                  key={field.key}
                  className="border-border rounded-2xl border p-4 text-sm"
                >
                  <p className="text-muted-foreground text-xs tracking-[0.2em]">
                    {field.label}
                  </p>
                  <p className="mt-3 text-base">{String(value)}</p>
                </div>
              );
            })}
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <h2 className="text-2xl">联系状态</h2>
        <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
          当前状态：{getContactStatusLabel(detail.contactStatus)}。
        </p>
        {detail.contactInfo ? (
          <div className="border-border mt-5 rounded-2xl border p-4 text-sm leading-7">
            <p>昵称：{detail.contactInfo.nickname}</p>
            <p>邮箱：{detail.contactInfo.email}</p>
          </div>
        ) : null}
        {detail.matchPairId && !detail.contactInfo ? (
          <form
            action={triggerMatchContactAction}
            className="mt-6"
          >
            <input type="hidden" name="matchPairId" value={detail.matchPairId} />
            <input type="hidden" name="matchResultId" value={detail.id} />
            <Button type="submit">联系 TA</Button>
          </form>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
