"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/site-ui";
import type { QuestionnaireSection } from "@/features/app/data";
import { QuestionnaireSections } from "@/features/app/questionnaire-sections";

type QuestionnaireAnswers = Record<string, string | string[] | number>;
type QuestionnaireSubmitAction = (formData: FormData) => Promise<void>;

type QuestionnaireFormProps = {
  answers: QuestionnaireAnswers;
  disabled: boolean;
  saveDraftAction: QuestionnaireSubmitAction;
  sections: QuestionnaireSection[];
  submitAction: QuestionnaireSubmitAction;
};

function hasMissingRequiredAnswers(
  formElement: HTMLFormElement,
  sections: QuestionnaireSection[],
) {
  const formData = new FormData(formElement);

  for (const section of sections) {
    for (const question of section.questions) {
      if (!question.isRequired) {
        continue;
      }

      const values = formData
        .getAll(question.questionCode)
        .flatMap((value) =>
          typeof value === "string" ? [value.trim()] : [],
        )
        .filter(Boolean);

      if (values.length === 0) {
        return true;
      }
    }
  }

  return false;
}

function hasMissingRequiredAnswersFromRecord(
  answers: QuestionnaireAnswers,
  sections: QuestionnaireSection[],
) {
  for (const section of sections) {
    for (const question of section.questions) {
      if (!question.isRequired) {
        continue;
      }

      const answerValue = answers[question.questionCode];
      if (question.kind === "multiple") {
        if (!Array.isArray(answerValue) || answerValue.length === 0) {
          return true;
        }
        continue;
      }

      if (
        typeof answerValue !== "string" &&
        typeof answerValue !== "number"
      ) {
        return true;
      }
    }
  }

  return false;
}

export function QuestionnaireForm({
  answers,
  disabled,
  saveDraftAction,
  sections,
  submitAction,
}: QuestionnaireFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [hasMissingRequired, setHasMissingRequired] = useState(() =>
    disabled
      ? false
      : hasMissingRequiredAnswersFromRecord(answers, sections),
  );

  function syncRequiredState() {
    if (disabled || !formRef.current) {
      setHasMissingRequired(false);
      return;
    }

    setHasMissingRequired(hasMissingRequiredAnswers(formRef.current, sections));
  }

  return (
    <form
      ref={formRef}
      className="mt-8 grid gap-8"
      onChange={syncRequiredState}
      onInput={syncRequiredState}
    >
      <QuestionnaireSections
        answers={answers}
        sections={sections}
        disabled={disabled}
      />
      {!disabled ? (
        <div className="flex flex-wrap justify-end gap-3">
          {hasMissingRequired ? (
            <p className="text-[color:var(--status-warning)] self-center text-xs leading-6">
              仍有必答题未完成，无法正式提交。
            </p>
          ) : null}
          <Button
            formAction={saveDraftAction}
            tone="soft"
            type="submit"
            formNoValidate
          >
            保存草稿
          </Button>
          <Button
            formAction={submitAction}
            type="submit"
            disabled={hasMissingRequired}
            className="disabled:cursor-default"
          >
            正式提交问卷
          </Button>
        </div>
      ) : null}
    </form>
  );
}
