import { describe, expect, it } from "vitest";

import {
  parseQuestionnaireImportJson,
  questionnaireImportSchema,
} from "@/features/admin/questionnaires/schema";

function createValidDefinition() {
  return {
    title: "2026 春季问卷",
    description: "用于测试导入逻辑的问卷版本",
    matchingPolicy: {
      minimumPairScore: 60,
      profileFilters: [
        {
          field: "gender",
          mode: "opposite_required",
        },
      ],
      profileScoring: [
        {
          field: "grade",
          mode: "same_bonus",
          weight: 0.6,
        },
        {
          field: "birth_year",
          mode: "distance_penalty",
          maxGap: 4,
          weight: 0.5,
        },
      ],
      questionScoring: {
        singleDefaultWeight: 1,
        multipleDefaultWeight: 1.2,
        scaleDefaultWeight: 1.5,
        minimumComparableQuestions: 2,
      },
    },
    sections: [
      {
        code: "life",
        title: "生活节奏",
        subtitle: "测试分组",
        description: "测试分组描述",
        sortOrder: 1,
        questions: [
          {
            questionCode: "q-single",
            kind: "single",
            prompt: "你更喜欢哪种节奏？",
            helperText: "单选题",
            isRequired: true,
            sortOrder: 1,
            options: [
              { id: "slow", label: "慢节奏" },
              { id: "fast", label: "快节奏" },
            ],
          },
          {
            questionCode: "q-scale",
            kind: "scale",
            prompt: "你希望关系推进有多快？",
            helperText: "量表题",
            isRequired: true,
            sortOrder: 2,
            scaleMin: 1,
            scaleMax: 5,
            scaleLeftLabel: "慢一些",
            scaleRightLabel: "快一些",
          },
        ],
      },
    ],
  };
}

describe("questionnaireImportSchema", () => {
  it("fills question weights from matching policy defaults", () => {
    const parsed = parseQuestionnaireImportJson(
      JSON.stringify(createValidDefinition()),
    );

    expect(parsed.sections[0]?.questions[0]?.weight).toBe(1);
    expect(parsed.sections[0]?.questions[1]?.weight).toBe(1.5);
  });

  it("rejects unsupported text questions", () => {
    const definition = createValidDefinition();
    definition.sections[0]?.questions.push({
      questionCode: "q-text",
      kind: "text",
      prompt: "请写一段话",
      helperText: "不支持的题型",
      isRequired: true,
      sortOrder: 3,
    } as never);

    const result = questionnaireImportSchema.safeParse(definition);

    expect(result.success).toBe(false);
  });

  it("rejects duplicate question codes", () => {
    const definition = createValidDefinition();
    definition.sections[0]?.questions.push({
      questionCode: "q-single",
      kind: "single",
      prompt: "重复题目",
      helperText: "重复编码",
      isRequired: true,
      sortOrder: 3,
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    } as never);

    const result = questionnaireImportSchema.safeParse(definition);

    expect(result.success).toBe(false);
  });
});
