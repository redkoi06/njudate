import { notFound, redirect } from "next/navigation";

import {
  Button,
  FlashToast,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import { triggerMatchContactAction } from "@/features/app/actions";
import { getMatchDetail } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/uuid";
import { getMatchStatusLabel } from "@/lib/site";

const MATCH_EXPLANATION_PARAGRAPHS = [
  "这次匹配会先排除在关键观念或生活习惯上可能存在明显冲突的人。",
  "在此基础上，系统会优先为你匹配问卷回答较为接近的人。",
  "我们没有展示相似度分数，因为比起一组数字，我们更希望你通过真实交流，去认识对方是一个怎样的人。",
  "算法能帮助你们相遇，真正让人靠近彼此的，还是交流、感受，以及一点缘分。",
] as const;
const MATCH_EXPLANATION_DETAILS = MATCH_EXPLANATION_PARAGRAPHS.slice(0, -1);
const MATCH_EXPLANATION_EMPHASIS =
  MATCH_EXPLANATION_PARAGRAPHS[MATCH_EXPLANATION_PARAGRAPHS.length - 1];
const UNMATCHED_EXPLANATION_DETAILS = [
  "这次没有匹配成功，并不代表你“不适合谁”，也不意味着系统只是按分数高低简单排序。",
  "我们的匹配会先排除在关键观念或生活习惯上可能存在明显冲突的组合；在此基础上，才会优先考虑问卷回答较为接近的人。",
  "因此，本轮暂未匹配，通常只说明在当前参与者范围内，我们还没有找到同时满足这些条件的对象。",
  "我们希望先帮大家避开明显不合适的人，再把真正的认识与判断，留给后续的交流、感受，以及一点缘分。",
] as const;
const UNMATCHED_EXPLANATION_EMPHASIS =
  "如果你认可这样的匹配方式，也欢迎把网站推荐给身边同样认真对待关系的人。参与的人越多，系统就越有机会在坚持这套原则的前提下，为大家创造新的相遇。";
const CONTACT_TRIGGER_NOTE = "点击后，双方都将立即看到彼此的联系方式。";
const CONTACT_RELEASE_NOTE =
  "由于一方已选择获取联系方式，双方的联系方式现已同时开放。";

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ matchId }, user, resolvedSearchParams] = await Promise.all([
    params,
    requireAppUser(),
    searchParams,
  ]);

  if (!isUuid(matchId)) {
    redirect("/app/matches?error=匹配结果链接无效。");
  }

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
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
      <FlashToast message={error} />
      <SurfaceCard>
        <SectionHeader
          eyebrow={detail.batchLabel}
          title={`\u7ed3\u679c\u72b6\u6001\uff1a${getMatchStatusLabel(detail.status)}`}
        />
      </SurfaceCard>

      {detail.status === "matched" ? (
        <SurfaceCard>
          <h2 className="text-2xl">关于这次匹配</h2>
          <div className="mt-5 grid gap-3">
            {MATCH_EXPLANATION_DETAILS.map((paragraph) => (
              <p
                key={paragraph}
                className="text-secondary-foreground text-sm leading-7 md:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
            <p className="border-primary/25 text-foreground mt-1 border-l-2 pl-4 text-base leading-7 md:text-[1.05rem]">
              {MATCH_EXPLANATION_EMPHASIS}
            </p>
          </div>
        </SurfaceCard>
      ) : null}

      {detail.status === "unmatched" ? (
        <SurfaceCard>
          <h2 className="text-2xl">关于这次未匹配</h2>
          <div className="mt-5 grid gap-3">
            {UNMATCHED_EXPLANATION_DETAILS.map((paragraph) => (
              <p
                key={paragraph}
                className="text-secondary-foreground text-sm leading-7 md:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
            <p className="border-primary/25 text-foreground mt-1 border-l-2 pl-4 text-base leading-7 md:text-[1.05rem]">
              {UNMATCHED_EXPLANATION_EMPHASIS}
            </p>
          </div>
        </SurfaceCard>
      ) : null}

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

      {detail.status === "matched" ||
      detail.contactInfo ||
      detail.matchPairId ? (
        <SurfaceCard>
          <h2 className="text-2xl">{"\u8054\u7cfbTA"}</h2>
          {detail.contactInfo ? (
            <div className="mt-5 grid gap-3">
              <p className="text-secondary-foreground text-sm leading-6">
                {CONTACT_RELEASE_NOTE}
              </p>
              <div className="border-border rounded-2xl border p-4 text-sm leading-7">
                <p>{`\u6635\u79f0\uff1a${detail.contactInfo.nickname}`}</p>
                <p>{`\u90ae\u7bb1\uff1a${detail.contactInfo.email}`}</p>
              </div>
            </div>
          ) : null}
          {detail.matchPairId && !detail.contactInfo ? (
            <form action={triggerMatchContactAction} className="mt-6">
              <input
                type="hidden"
                name="matchPairId"
                value={detail.matchPairId}
              />
              <input type="hidden" name="matchResultId" value={detail.id} />
              <Button type="submit">
                {"\u70b9\u51fb\u83b7\u53d6TA\u7684\u8054\u7cfb\u65b9\u5f0f"}
              </Button>
              <p className="text-secondary-foreground/80 mt-3 text-sm leading-6">
                {CONTACT_TRIGGER_NOTE}
              </p>
            </form>
          ) : null}
        </SurfaceCard>
      ) : null}
    </div>
  );
}
