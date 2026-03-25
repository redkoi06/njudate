import { z } from "zod";

const weightSchema = z.number().positive("权重必须大于 0");

export const profileFilterSchema = z.object({
  field: z.literal("gender"),
  mode: z.literal("opposite_required"),
});

const sameBonusProfileScoringSchema = z.object({
  field: z.enum(["grade", "department", "campus"]),
  mode: z.literal("same_bonus"),
  weight: weightSchema,
});

const birthYearDistanceScoringSchema = z.object({
  field: z.literal("birth_year"),
  mode: z.literal("distance_penalty"),
  maxGap: z.number().int().positive("年龄差阈值必须大于 0"),
  weight: weightSchema,
});

export const profileScoringRuleSchema = z.union([
  sameBonusProfileScoringSchema,
  birthYearDistanceScoringSchema,
]);

export const questionScoringConfigSchema = z.object({
  singleDefaultWeight: weightSchema,
  multipleDefaultWeight: weightSchema,
  scaleDefaultWeight: weightSchema,
  minimumComparableQuestions: z
    .number()
    .int("最少可比较题数必须是整数")
    .min(1, "最少可比较题数至少为 1"),
});

export const matchingPolicySchema = z
  .object({
    minimumPairScore: z
      .number()
      .int("最低匹配分必须是整数")
      .min(0, "最低匹配分不能小于 0")
      .max(100, "最低匹配分不能大于 100"),
    profileFilters: z.tuple([profileFilterSchema]),
    profileScoring: z.array(profileScoringRuleSchema),
    questionScoring: questionScoringConfigSchema,
  })
  .superRefine((value, ctx) => {
    const seenFields = new Set<string>();

    value.profileScoring.forEach((rule, index) => {
      if (seenFields.has(rule.field)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `基础资料计分字段 "${rule.field}" 不能重复声明`,
          path: ["profileScoring", index, "field"],
        });
      }

      seenFields.add(rule.field);
    });
  });

export type ProfileFilterRule = z.infer<typeof profileFilterSchema>;
export type ProfileScoringRule = z.infer<typeof profileScoringRuleSchema>;
export type QuestionScoringConfig = z.infer<typeof questionScoringConfigSchema>;
export type MatchingPolicy = z.infer<typeof matchingPolicySchema>;
