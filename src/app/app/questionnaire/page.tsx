import { Badge, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  saveQuestionnaireDraftAction,
  submitQuestionnaireAction,
} from "@/features/app/actions";
import { getQuestionnaireState } from "@/features/app/data";
import { QuestionnaireForm } from "@/features/app/questionnaire-form";
import { requireAppUser } from "@/lib/auth/session";
import { getQuestionnaireStatusHint } from "@/lib/site";

function getQuestionnaireBadgeLabel(input: {
  status: "not_started" | "draft" | "submitted" | "updated";
  windowStatus: "open" | "closed";
}) {
  if (input.windowStatus === "closed") {
    return "通道关闭";
  }

  switch (input.status) {
    case "not_started":
      return "未开始";
    case "draft":
      return "草稿未提交";
    case "submitted":
      return "已提交";
    case "updated":
      return "有未提交草稿";
  }
}

export default async function QuestionnairePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireAppUser();
  const questionnaire = await getQuestionnaireState(user.id);
  const isClosed = questionnaire.windowStatus === "closed";
  const draftSaved = resolvedSearchParams?.draftSaved === "1";
  const questionnaireSubmitted =
    resolvedSearchParams?.questionnaireSubmitted === "1";
  const successMessage = questionnaireSubmitted
    ? "问卷已正式提交。"
    : draftSaved
      ? "草稿已保存。"
      : null;

  return (
    <SurfaceCard>
      <SectionHeader
        title={questionnaire.title}
        description={questionnaire.description}
        action={
          <Badge
            tone={
              isClosed
                ? "warning"
                : questionnaire.status === "submitted" ||
                    questionnaire.status === "updated"
                  ? "success"
                  : "soft"
            }
          >
            {getQuestionnaireBadgeLabel({
              status: questionnaire.status,
              windowStatus: questionnaire.windowStatus,
            })}
          </Badge>
        }
      />
      <div className="mt-6 rounded-2xl border border-border bg-background/70 px-4 py-4 text-sm leading-7 text-secondary-foreground">
        {getQuestionnaireStatusHint({
          resultPublishAt: questionnaire.resultPublishAt,
          signupEndAt: questionnaire.signupEndAt,
          status: questionnaire.status,
          windowStatus: questionnaire.windowStatus,
        })}
      </div>
      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--status-success)]/20 bg-[color:var(--status-success-bg)] px-4 py-3 text-sm text-[color:var(--status-success)]">
          {successMessage}
        </div>
      ) : null}
      <QuestionnaireForm
        answers={questionnaire.answers}
        sections={questionnaire.sections}
        disabled={isClosed}
        saveDraftAction={saveQuestionnaireDraftAction}
        submitAction={submitQuestionnaireAction}
      />
    </SurfaceCard>
  );
}
