import "server-only";

import type { QuestionnaireSection } from "@/features/app/data";
import {
  matchingPolicySchema,
  type MatchingPolicy,
} from "@/lib/matching/policy";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { summarizeMatchingPolicy } from "./schema";

export type AdminQuestionnaireVersionSummary = {
  archivedAt: string | null;
  createdAt: string;
  id: string;
  publishedAt: string | null;
  status: "draft" | "published" | "archived";
  title: string;
  versionNo: number;
};

export type AdminQuestionnaireVersionDetail = {
  createdAt: string;
  description: string;
  id: string;
  matchingPolicy: MatchingPolicy;
  matchingPolicySummary: string[];
  publishedAt: string | null;
  sections: QuestionnaireSection[];
  status: "draft" | "published" | "archived";
  title: string;
  versionNo: number;
};

export type QuestionnairePublishingGate = {
  canManage: boolean;
  reason: string | null;
};

function mapQuestionOptionList(raw: unknown) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "label" in item &&
      typeof item.id === "string" &&
      typeof item.label === "string"
    ) {
      return [{ id: item.id, label: item.label }];
    }

    return [];
  });
}

export async function getQuestionnairePublishingGate() {
  const admin = createAdminSupabaseClient();
  const [openBatchResult, batchCountResult, currentBatchResult] = await Promise.all([
    admin
      .from("match_batches")
      .select("id", { head: true, count: "exact" })
      .eq("status", "open"),
    admin.from("match_batches").select("id", { head: true, count: "exact" }),
    admin
      .from("match_batches")
      .select("id, result_publish_at, status")
      .in("status", ["open", "locked", "processing", "failed", "published"])
      .order("signup_end_at", { ascending: false })
      .limit(10),
  ]);

  if (openBatchResult.error) {
    throw openBatchResult.error;
  }

  if (batchCountResult.error) {
    throw batchCountResult.error;
  }

  if (currentBatchResult.error) {
    throw currentBatchResult.error;
  }

  if ((openBatchResult.count ?? 0) > 0) {
    return {
      canManage: false,
      reason: "当前存在 open 批次，不能导入或发布新问卷。",
    } satisfies QuestionnairePublishingGate;
  }

  if ((batchCountResult.count ?? 0) === 0) {
    return {
      canManage: true,
      reason: null,
    } satisfies QuestionnairePublishingGate;
  }

  const nowIso = new Date().toISOString();
  const currentBatch = (currentBatchResult.data ?? []).find(
    (batch) =>
      batch.status === "locked" ||
      batch.status === "processing" ||
      batch.status === "failed" ||
      (batch.status === "published" && batch.result_publish_at > nowIso),
  );

  if (!currentBatch || currentBatch.result_publish_at <= nowIso) {
    return {
      canManage: false,
      reason: "仅允许在当前轮报名截止后到结果公布前导入或发布新问卷。",
    } satisfies QuestionnairePublishingGate;
  }

  return {
    canManage: true,
    reason: null,
  } satisfies QuestionnairePublishingGate;
}

export async function listQuestionnaireVersions() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("questionnaire_versions")
    .select("id, version_no, status, title, created_at, published_at, archived_at")
    .order("version_no", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    archivedAt: item.archived_at,
    createdAt: item.created_at,
    id: item.id,
    publishedAt: item.published_at,
    status: item.status,
    title: item.title,
    versionNo: item.version_no,
  })) satisfies AdminQuestionnaireVersionSummary[];
}

export async function getQuestionnaireVersionDetail(versionId: string) {
  const admin = createAdminSupabaseClient();
  const [versionResult, sectionsResult, questionsResult] = await Promise.all([
    admin
      .from("questionnaire_versions")
      .select(
        "id, version_no, status, title, description, created_at, published_at, matching_policy_json",
      )
      .eq("id", versionId)
      .maybeSingle(),
    admin
      .from("questionnaire_sections")
      .select("id, code, title, subtitle, description, sort_order")
      .eq("questionnaire_version_id", versionId)
      .order("sort_order", { ascending: true }),
    admin
      .from("questionnaire_questions")
      .select(
        "id, section_id, question_code, kind, prompt, helper_text, placeholder, is_required, options_json, scale_min, scale_max, scale_left_label, scale_right_label, sort_order, weight",
      )
      .eq("questionnaire_version_id", versionId)
      .order("sort_order", { ascending: true }),
  ]);

  if (versionResult.error) {
    throw versionResult.error;
  }

  if (sectionsResult.error) {
    throw sectionsResult.error;
  }

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  if (!versionResult.data) {
    return null;
  }

  const matchingPolicy = matchingPolicySchema.parse(
    versionResult.data.matching_policy_json,
  );

  const sections = (sectionsResult.data ?? []).map((section) => ({
    id: section.id,
    code: section.code,
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    sortOrder: section.sort_order,
    questions: (questionsResult.data ?? [])
      .filter((question) => question.section_id === section.id)
      .map((question) => ({
        id: question.id,
        questionCode: question.question_code,
        kind: question.kind,
        prompt: question.prompt,
        helperText: question.helper_text,
        placeholder: question.placeholder,
        isRequired: question.is_required,
        options: mapQuestionOptionList(question.options_json),
        scaleMin: question.scale_min,
        scaleMax: question.scale_max,
        scaleLeftLabel: question.scale_left_label,
        scaleRightLabel: question.scale_right_label,
        sortOrder: question.sort_order,
        weight: question.weight,
      })),
  })) satisfies QuestionnaireSection[];

  return {
    createdAt: versionResult.data.created_at,
    description: versionResult.data.description,
    id: versionResult.data.id,
    matchingPolicy,
    matchingPolicySummary: summarizeMatchingPolicy(matchingPolicy),
    publishedAt: versionResult.data.published_at,
    sections,
    status: versionResult.data.status,
    title: versionResult.data.title,
    versionNo: versionResult.data.version_no,
  } satisfies AdminQuestionnaireVersionDetail;
}
