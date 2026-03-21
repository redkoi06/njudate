import { Button, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  cancelCurrentBatchAction,
  joinCurrentBatchAction,
} from "@/features/app/actions";
import { getParticipationState } from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime, getParticipationStatusLabel } from "@/lib/site";

export default async function ParticipationPage() {
  const user = await requireSessionUser();
  const participation = await getParticipationState(user.id);

  return (
    <SurfaceCard>
      <SectionHeader
        eyebrow="本周参与"
        title={participation.label ?? "当前没有开放批次"}
        description={
          participation.label
            ? `报名截止：${formatDateTime(participation.signupEndAt)}，结果公布：${formatDateTime(participation.matchRunAt)}。`
            : "当新的匹配批次开放后，你可以在这里决定本周是否加入。"
        }
      />
      <div className="mt-8 grid gap-4">
        <div className="border-border rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs tracking-[0.2em]">当前状态</p>
          <p className="mt-3 text-2xl">
            {getParticipationStatusLabel(participation.status)}
          </p>
          {participation.reason ? (
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              {participation.reason}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          {participation.status === "not_joined" ? (
            <form action={joinCurrentBatchAction}>
              <Button type="submit">加入本周匹配</Button>
            </form>
          ) : null}
          {participation.status === "joined" ? (
            <form action={cancelCurrentBatchAction}>
              <Button tone="soft" type="submit">
                取消本周参与
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}
