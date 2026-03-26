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
  hasDraft: boolean;
  saveDraftAction: QuestionnaireSubmitAction;
  sections: QuestionnaireSection[];
  submitAction: QuestionnaireSubmitAction;
};

function normalizeQuestionnaireValue(
  question: QuestionnaireSection["questions"][number],
  value: FormDataEntryValue | FormDataEntryValue[] | string | string[] | number,
) {
  if (question.kind === "multiple") {
    if (!Array.isArray(value)) {
      return null;
    }

    const normalizedValues = value
      .flatMap((item) => (typeof item === "string" ? [item.trim()] : []))
      .filter(Boolean)
      .sort();

    return normalizedValues.length > 0 ? normalizedValues : null;
  }

  if (question.kind === "scale") {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value !== "string") {
      return null;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return null;
    }

    const numericValue = Number(normalizedValue);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function buildQuestionnaireSnapshot(
  sections: QuestionnaireSection[],
  getValue: (
    question: QuestionnaireSection["questions"][number],
  ) => string | string[] | number | null,
) {
  const entries: Array<[string, string | string[] | number]> = [];

  for (const section of sections) {
    for (const question of section.questions) {
      const value = getValue(question);
      if (value !== null) {
        entries.push([question.questionCode, value]);
      }
    }
  }

  return JSON.stringify(entries);
}

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
        .flatMap((value) => (typeof value === "string" ? [value.trim()] : []))
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

      if (typeof answerValue !== "string" && typeof answerValue !== "number") {
        return true;
      }
    }
  }

  return false;
}

function buildQuestionnaireSnapshotFromForm(
  formElement: HTMLFormElement,
  sections: QuestionnaireSection[],
) {
  const formData = new FormData(formElement);

  return buildQuestionnaireSnapshot(sections, (question) => {
    if (question.kind === "multiple") {
      return normalizeQuestionnaireValue(
        question,
        formData.getAll(question.questionCode),
      );
    }

    return normalizeQuestionnaireValue(
      question,
      formData.get(question.questionCode) ?? "",
    );
  });
}

function buildQuestionnaireSnapshotFromRecord(
  answers: QuestionnaireAnswers,
  sections: QuestionnaireSection[],
) {
  return buildQuestionnaireSnapshot(sections, (question) =>
    normalizeQuestionnaireValue(question, answers[question.questionCode] ?? ""),
  );
}

export function QuestionnaireForm({
  answers,
  disabled,
  hasDraft,
  saveDraftAction,
  sections,
  submitAction,
}: QuestionnaireFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialSnapshot = buildQuestionnaireSnapshotFromRecord(
    answers,
    sections,
  );
  const [hasMissingRequired, setHasMissingRequired] = useState(() =>
    disabled ? false : hasMissingRequiredAnswersFromRecord(answers, sections),
  );
  const [hasChanges, setHasChanges] = useState(false);

  function syncFormState() {
    if (disabled || !formRef.current) {
      setHasMissingRequired(false);
      setHasChanges(false);
      return;
    }

    setHasMissingRequired(hasMissingRequiredAnswers(formRef.current, sections));
    setHasChanges(
      buildQuestionnaireSnapshotFromForm(formRef.current, sections) !==
        initialSnapshot,
    );
  }

  return (
    <form
      ref={formRef}
      className="mt-8 grid gap-8"
      onChange={syncFormState}
      onInput={syncFormState}
    >
      <QuestionnaireSections
        answers={answers}
        sections={sections}
        disabled={disabled}
      />
      {!disabled ? (
        <div className="flex flex-wrap justify-end gap-3">
          {hasMissingRequired ? (
            <p className="self-center text-xs leading-6 text-[color:var(--status-warning)]">
              仍有必答题未完成，无法正式提交。
            </p>
          ) : null}
          <Button
            formAction={saveDraftAction}
            tone="soft"
            type="submit"
            formNoValidate
            disabled={!hasChanges}
            className="disabled:cursor-default"
          >
            保存草稿
          </Button>
          <Button
            formAction={submitAction}
            type="submit"
            disabled={hasMissingRequired || (!hasChanges && !hasDraft)}
            className="disabled:cursor-default"
          >
            正式提交问卷
          </Button>
        </div>
      ) : null}
    </form>
  );
}
