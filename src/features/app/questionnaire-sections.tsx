import type { QuestionnaireSection } from "@/features/app/data";

type QuestionnaireSectionsProps = {
  answers: Record<string, string | string[] | number>;
  disabled?: boolean;
  sections: QuestionnaireSection[];
};

export function QuestionnaireSections({
  answers,
  disabled = false,
  sections,
}: QuestionnaireSectionsProps) {
  return (
    <>
      {sections.map((section) => (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm leading-7">{question.prompt}</p>
                    <span
                      className={
                        question.isRequired
                          ? "rounded-full border border-[color:var(--status-warning)]/30 bg-[color:var(--status-warning-bg)] px-2 py-0.5 text-[10px] leading-4 text-[color:var(--status-warning)]"
                          : "text-muted-foreground rounded-full border border-border bg-background px-2 py-0.5 text-[10px] leading-4"
                      }
                    >
                      {question.isRequired ? "必答" : "选答"}
                    </span>
                  </div>
                  {question.helperText ? (
                    <p className="text-muted-foreground mt-1 text-xs leading-6">
                      {question.helperText}
                    </p>
                  ) : null}
                </div>

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
                          defaultChecked={answers[question.questionCode] === option.id}
                          required={question.isRequired}
                          disabled={disabled}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : null}

                {question.kind === "multiple" ? (
                  <div className="grid gap-2">
                    {question.options.map((option) => {
                      const answerValue = answers[question.questionCode];
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
                            disabled={disabled}
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
                            defaultChecked={answers[question.questionCode] === value}
                            required={question.isRequired}
                            disabled={disabled}
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
    </>
  );
}
