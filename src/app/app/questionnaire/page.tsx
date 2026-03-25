import { Badge, Button, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  saveQuestionnaireDraftAction,
  submitQuestionnaireAction,
} from "@/features/app/actions";
import { getQuestionnaireState } from "@/features/app/data";
import { QuestionnaireSections } from "@/features/app/questionnaire-sections";
import { requireAppUser } from "@/lib/auth/session";
import {
  getQuestionnaireStatusHint,
  getQuestionnaireSubmissionStatusLabel,
} from "@/lib/site";

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

export default async function QuestionnairePage() {
  const user = await requireAppUser();
  const questionnaire = await getQuestionnaireState(user.id);
  const isClosed = questionnaire.windowStatus === "closed";

  return (
    <SurfaceCard>
      <SectionHeader
        eyebrow={`问卷版本 ${questionnaire.versionNo}`}
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
      {!isClosed ? (
        <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
          当前状态：{getQuestionnaireSubmissionStatusLabel(questionnaire.status)}。
        </p>
      ) : null}
      <form className="mt-8 grid gap-8">
        <QuestionnaireSections
          answers={questionnaire.answers}
          sections={questionnaire.sections}
          disabled={isClosed}
        />
        {!isClosed ? (
          <div className="flex flex-wrap justify-end gap-3">
            <Button formAction={saveQuestionnaireDraftAction} tone="soft" type="submit">
              保存草稿
            </Button>
            <Button formAction={submitQuestionnaireAction} type="submit">
              正式提交问卷
            </Button>
          </div>
        ) : null}
      </form>
    </SurfaceCard>
  );
}
