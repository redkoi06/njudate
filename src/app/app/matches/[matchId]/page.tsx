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

  const counterpartProfileItems = [
    { label: "\u6821\u533a", value: detail.counterpartSnapshot?.campus },
    { label: "\u9662\u7cfb", value: detail.counterpartSnapshot?.department },
    { label: "\u5e74\u7ea7", value: detail.counterpartSnapshot?.grade },
  ].flatMap((item) =>
    typeof item.value === "string" && item.value.length > 0
      ? [{ label: item.label, value: item.value }]
      : [],
  );

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow={detail.batchLabel}
          title={`\u7ed3\u679c\u72b6\u6001\uff1a${getMatchStatusLabel(detail.status)}`}
        />
      </SurfaceCard>

      {counterpartProfileItems.length > 0 ? (
        <SurfaceCard>
          <h2 className="text-2xl">{"\u5173\u4e8eTA"}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {counterpartProfileItems.map((item) => (
              <div
                key={item.label}
                className="border-border rounded-2xl border p-4"
              >
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <p className="mt-2 text-base leading-7">{item.value}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <h2 className="text-2xl">{"\u8054\u7cfbTA"}</h2>
        {detail.contactInfo ? (
          <div className="border-border mt-5 rounded-2xl border p-4 text-sm leading-7">
            <p>{`\u6635\u79f0\uff1a${detail.contactInfo.nickname}`}</p>
            <p>{`\u90ae\u7bb1\uff1a${detail.contactInfo.email}`}</p>
          </div>
        ) : null}
        {detail.matchPairId && !detail.contactInfo ? (
          <form
            action={triggerMatchContactAction}
            className="mt-6"
          >
            <input type="hidden" name="matchPairId" value={detail.matchPairId} />
            <input type="hidden" name="matchResultId" value={detail.id} />
            <Button type="submit">
              {"\u70b9\u51fb\u83b7\u53d6TA\u7684\u8054\u7cfb\u65b9\u5f0f"}
            </Button>
          </form>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
