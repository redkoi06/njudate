import { Button, SectionHeader, SurfaceCard, TextArea } from "@/components/site-ui";
import {
  saveQuestionnaireDraftAction,
  submitQuestionnaireAction,
} from "@/features/app/actions";
import { getQuestionnaireState } from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";

export default async function QuestionnairePage() {
  const user = await requireSessionUser();
  const questionnaire = await getQuestionnaireState(user.id);

  return (
    <SurfaceCard>
      <SectionHeader
        eyebrow={`问卷版本 ${questionnaire.versionNo}`}
        title={questionnaire.title}
        description={questionnaire.description}
      />
      <form className="mt-8 grid gap-8">
        {questionnaire.sections.map((section) => (
          <section key={section.id} className="border-border rounded-[24px] border p-5">
            <h2 className="text-2xl">{section.title}</h2>
            {section.subtitle ? (
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                {section.subtitle}
              </p>
            ) : null}
            <p className="text-secondary-foreground/80 mt-2 text-sm leading-7">
              {section.description}
            </p>
            <div className="mt-6 grid gap-6">
              {section.questions.map((question) => (
                <div key={question.id} className="grid gap-3">
                  <div>
                    <p className="text-sm leading-7">{question.prompt}</p>
                    {question.helperText ? (
                      <p className="text-muted-foreground mt-1 text-xs leading-6">
                        {question.helperText}
                      </p>
                    ) : null}
                  </div>

                  {question.kind === "text" ? (
                    <TextArea
                      name={question.questionCode}
                      label="回答"
                      defaultValue={
                        typeof questionnaire.answers[question.questionCode] === "string"
                          ? questionnaire.answers[question.questionCode]
                          : ""
                      }
                      placeholder={question.placeholder ?? undefined}
                    />
                  ) : null}

                  {question.kind === "single" ? (
                    <div className="grid gap-2">
                      {question.options.map((option) => (
                        <label
                          key={option.id}
                          className="border-border flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                        >
                          <input
                            type="radio"
                            name={question.questionCode}
                            value={option.id}
                            defaultChecked={questionnaire.answers[question.questionCode] === option.id}
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {question.kind === "multiple" ? (
                    <div className="grid gap-2">
                      {question.options.map((option) => {
                        const answerValue = questionnaire.answers[question.questionCode];
                        const values = Array.isArray(answerValue) ? answerValue : [];

                        return (
                          <label
                            key={option.id}
                            className="border-border flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                          >
                            <input
                              type="checkbox"
                              name={question.questionCode}
                              value={option.id}
                              defaultChecked={values.includes(option.id)}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  ) : null}

                  {question.kind === "scale" ? (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{question.scaleLeftLabel}</span>
                        <span>{question.scaleRightLabel}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          {
                            length:
                              (question.scaleMax ?? 5) - (question.scaleMin ?? 1) + 1,
                          },
                          (_, index) => (question.scaleMin ?? 1) + index,
                        ).map((value) => (
                          <label
                            key={value}
                            className="border-border flex min-w-12 items-center justify-center rounded-full border px-4 py-3 text-sm"
                          >
                            <input
                              type="radio"
                              name={question.questionCode}
                              value={value}
                              defaultChecked={questionnaire.answers[question.questionCode] === value}
                            />
                            <span className="ml-2">{value}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="flex flex-wrap justify-end gap-3">
          <Button formAction={saveQuestionnaireDraftAction} tone="soft" type="submit">
            保存草稿
          </Button>
          <Button formAction={submitQuestionnaireAction} type="submit">
            正式提交问卷
          </Button>
        </div>
      </form>
    </SurfaceCard>
  );
}
