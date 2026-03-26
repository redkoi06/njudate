import { notFound } from "next/navigation";

import { Button, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { triggerMatchContactAction } from "@/features/app/actions";
import { getMatchDetail } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";
import { getMatchStatusLabel } from "@/lib/site";

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
        />
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

      <SurfaceCard>
        <h2 className="text-2xl">联系TA</h2>
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
            <Button type="submit">点击获取TA的联系方式</Button>
          </form>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
