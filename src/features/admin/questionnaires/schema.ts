import { z } from "zod";

import {
  matchingPolicySchema,
  type MatchingPolicy,
} from "@/lib/matching/policy";

const sortOrderSchema = z
  .number()
  .int("排序值必须是整数")
  .min(0, "排序值不能小于 0");

const optionSchema = z.object({
  id: z.string().trim().min(1, "选项 id 不能为空"),
  label: z.string().trim().min(1, "选项文案不能为空"),
});

const questionBaseSchema = z.object({
  questionCode: z.string().trim().min(1, "题目编码不能为空"),
  prompt: z.string().trim().min(1, "题目标题不能为空"),
  helperText: z.string().trim().min(1).nullish().transform((value) => value ?? null),
  isRequired: z.boolean(),
  sortOrder: sortOrderSchema,
  weight: z.number().positive("题目权重必须大于 0").optional(),
});

const singleOrMultipleQuestionSchema = questionBaseSchema.extend({
  kind: z.enum(["single", "multiple"]),
  options: z.array(optionSchema).min(2, "选择题至少需要两个选项"),
});

const scaleQuestionSchema = questionBaseSchema.extend({
  kind: z.literal("scale"),
  scaleMin: z.number().int("量表最小值必须是整数"),
  scaleMax: z.number().int("量表最大值必须是整数"),
  scaleLeftLabel: z.string().trim().min(1, "量表左侧文案不能为空"),
  scaleRightLabel: z.string().trim().min(1, "量表右侧文案不能为空"),
});

export const questionnaireImportQuestionSchema = z
  .union([singleOrMultipleQuestionSchema, scaleQuestionSchema])
  .superRefine((question, ctx) => {
    if ("options" in question) {
      const seenIds = new Set<string>();

      question.options.forEach((option, index) => {
        if (seenIds.has(option.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `题目 "${question.questionCode}" 的选项 id 不能重复`,
            path: ["options", index, "id"],
          });
        }

        seenIds.add(option.id);
      });
    }

    if (question.kind === "scale" && question.scaleMin >= question.scaleMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `题目 "${question.questionCode}" 的量表最小值必须小于最大值`,
        path: ["scaleMin"],
      });
    }
  });

export const questionnaireImportSectionSchema = z.object({
  code: z.string().trim().min(1, "分组编码不能为空"),
  title: z.string().trim().min(1, "分组标题不能为空"),
  subtitle: z.string().trim().nullish().transform((value) => value ?? ""),
  description: z.string().trim().nullish().transform((value) => value ?? ""),
  sortOrder: sortOrderSchema,
  questions: z.array(questionnaireImportQuestionSchema).min(1, "每个分组至少需要一道题"),
});

export const questionnaireImportSchema = z
  .object({
    title: z.string().trim().min(1, "问卷标题不能为空"),
    description: z.string().trim().min(1, "问卷描述不能为空"),
    matchingPolicy: matchingPolicySchema,
    sections: z.array(questionnaireImportSectionSchema).min(1, "至少需要一个分组"),
  })
  .superRefine((value, ctx) => {
    const seenSectionCodes = new Set<string>();
    const seenQuestionCodes = new Set<string>();

    value.sections.forEach((section, sectionIndex) => {
      if (seenSectionCodes.has(section.code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `分组编码 "${section.code}" 不能重复`,
          path: ["sections", sectionIndex, "code"],
        });
      }

      seenSectionCodes.add(section.code);

      section.questions.forEach((question, questionIndex) => {
        if (seenQuestionCodes.has(question.questionCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `题目编码 "${question.questionCode}" 不能重复`,
            path: ["sections", sectionIndex, "questions", questionIndex, "questionCode"],
          });
        }

        seenQuestionCodes.add(question.questionCode);
      });
    });
  });

export type QuestionnaireImportDefinition = z.infer<typeof questionnaireImportSchema>;
export type QuestionnaireImportSection = z.infer<typeof questionnaireImportSectionSchema>;
export type QuestionnaireImportQuestion = z.infer<typeof questionnaireImportQuestionSchema>;

export function getDefaultQuestionWeight(
  kind: QuestionnaireImportQuestion["kind"],
  matchingPolicy: MatchingPolicy,
) {
  switch (kind) {
    case "single":
      return matchingPolicy.questionScoring.singleDefaultWeight;
    case "multiple":
      return matchingPolicy.questionScoring.multipleDefaultWeight;
    case "scale":
      return matchingPolicy.questionScoring.scaleDefaultWeight;
  }
}

export function normalizeQuestionnaireImportDefinition(
  definition: QuestionnaireImportDefinition,
) {
  return {
    ...definition,
    sections: definition.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        weight:
          question.weight ??
          getDefaultQuestionWeight(question.kind, definition.matchingPolicy),
      })),
    })),
  };
}

export function parseQuestionnaireImportJson(jsonText: string) {
  return normalizeQuestionnaireImportDefinition(
    questionnaireImportSchema.parse(JSON.parse(jsonText)) as QuestionnaireImportDefinition,
  );
}

export function summarizeMatchingPolicy(matchingPolicy: MatchingPolicy) {
  const profileScoringSummary = matchingPolicy.profileScoring.map((rule) => {
    if (rule.field === "birth_year") {
      return `年龄差惩罚，maxGap = ${rule.maxGap}，权重 ${rule.weight}`;
    }

    return `${rule.field} 相同加分，权重 ${rule.weight}`;
  });

  return [
    `最低匹配阈值 ${matchingPolicy.minimumPairScore}`,
    "性别规则：仅允许异性匹配",
    ...profileScoringSummary,
    `single 默认权重 ${matchingPolicy.questionScoring.singleDefaultWeight}`,
    `multiple 默认权重 ${matchingPolicy.questionScoring.multipleDefaultWeight}`,
    `scale 默认权重 ${matchingPolicy.questionScoring.scaleDefaultWeight}`,
    `最少可比较题数 ${matchingPolicy.questionScoring.minimumComparableQuestions}`,
  ];
}
