"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

import { getQuestionnairePublishingGate } from "./data";
import { parseQuestionnaireImportJson } from "./schema";

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithMessage(
  pathname: string,
  params: Record<string, string | null>,
): never {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  redirect(
    searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname,
  );
}

async function logQuestionnaireOperation(input: {
  actionType: string;
  actorUserId: string;
  entityId: string;
  payloadJson?: Json;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("operation_logs").insert({
    actor_role: "admin",
    actor_user_id: input.actorUserId,
    action_type: input.actionType,
    entity_type: "questionnaire_version",
    entity_id: input.entityId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function importQuestionnaireDefinitionAction(formData: FormData) {
  const actor = await requireAdminUser();
  const definitionJson = stringField(formData, "definitionJson").trim();

  if (!definitionJson) {
    redirectWithMessage("/admin/questionnaires/import", {
      error: "请先粘贴完整的问卷 JSON。",
    });
  }

  const gate = await getQuestionnairePublishingGate();
  if (!gate.canManage) {
    redirectWithMessage("/admin/questionnaires/import", {
      error: gate.reason,
    });
  }

  const definition = (() => {
    try {
      return parseQuestionnaireImportJson(definitionJson);
    } catch (error) {
      return redirectWithMessage("/admin/questionnaires/import", {
        error: error instanceof Error ? error.message : "问卷 JSON 解析失败。",
      });
    }
  })();

  const admin = createAdminSupabaseClient();
  const [draftResult, latestVersionResult] = await Promise.all([
    admin
      .from("questionnaire_versions")
      .select("id")
      .eq("status", "draft")
      .maybeSingle(),
    admin
      .from("questionnaire_versions")
      .select("version_no")
      .order("version_no", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (draftResult.error) {
    throw draftResult.error;
  }

  if (latestVersionResult.error) {
    throw latestVersionResult.error;
  }

  if (draftResult.data?.id) {
    const { error: deleteDraftError } = await admin
      .from("questionnaire_versions")
      .delete()
      .eq("id", draftResult.data.id)
      .eq("status", "draft");

    if (deleteDraftError) {
      throw deleteDraftError;
    }
  }

  const nextVersionNo = (latestVersionResult.data?.version_no ?? 0) + 1;
  const { data: createdVersion, error: createVersionError } = await admin
    .from("questionnaire_versions")
    .insert({
      version_no: nextVersionNo,
      status: "draft",
      title: definition.title,
      description: definition.description,
      matching_policy_json: definition.matchingPolicy,
      created_by: actor.id,
      published_at: null,
      archived_at: null,
    })
    .select("id")
    .single();

  if (createVersionError) {
    throw createVersionError;
  }

  const { data: insertedSections, error: insertSectionsError } = await admin
    .from("questionnaire_sections")
    .insert(
      definition.sections.map((section) => ({
        questionnaire_version_id: createdVersion.id,
        code: section.code,
        title: section.title,
        subtitle: section.subtitle,
        description: section.description,
        sort_order: section.sortOrder,
      })),
    )
    .select("id, code");

  if (insertSectionsError) {
    throw insertSectionsError;
  }

  const sectionIdByCode = new Map(
    (insertedSections ?? []).map((section) => [section.code, section.id]),
  );

  const questionRows = definition.sections.flatMap((section) =>
    section.questions.map((question) => ({
      questionnaire_version_id: createdVersion.id,
      section_id: sectionIdByCode.get(section.code) ?? "",
      question_code: question.questionCode,
      kind: question.kind,
      prompt: question.prompt,
      helper_text: question.helperText,
      placeholder: null,
      is_required: question.isRequired,
      options_json: "options" in question ? question.options : null,
      scale_min: question.kind === "scale" ? question.scaleMin : null,
      scale_max: question.kind === "scale" ? question.scaleMax : null,
      scale_left_label:
        question.kind === "scale" ? question.scaleLeftLabel : null,
      scale_middle_label:
        question.kind === "scale" ? question.scaleMiddleLabel : null,
      scale_right_label:
        question.kind === "scale" ? question.scaleRightLabel : null,
      sort_order: question.sortOrder,
      weight: question.weight,
    })),
  );

  const { error: insertQuestionsError } = await admin
    .from("questionnaire_questions")
    .insert(questionRows);

  if (insertQuestionsError) {
    throw insertQuestionsError;
  }

  await logQuestionnaireOperation({
    actionType: "questionnaire_imported",
    actorUserId: actor.id,
    entityId: createdVersion.id,
    payloadJson: {
      section_count: definition.sections.length,
      version_no: nextVersionNo,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/questionnaires");
  redirect(`/admin/questionnaires/${createdVersion.id}`);
}

export async function publishQuestionnaireVersionAction(formData: FormData) {
  const actor = await requireAdminUser();
  const versionId = stringField(formData, "versionId");
  const gate = await getQuestionnairePublishingGate();

  if (!versionId) {
    redirectWithMessage("/admin/questionnaires", {
      error: "缺少待发布的问卷版本。",
    });
  }

  if (!gate.canManage) {
    redirectWithMessage(`/admin/questionnaires/${versionId}`, {
      error: gate.reason,
    });
  }

  const admin = createAdminSupabaseClient();
  const { data: draftVersion, error: draftVersionError } = await admin
    .from("questionnaire_versions")
    .select("id, version_no, status")
    .eq("id", versionId)
    .maybeSingle();

  if (draftVersionError) {
    throw draftVersionError;
  }

  if (!draftVersion || draftVersion.status !== "draft") {
    redirectWithMessage("/admin/questionnaires", {
      error: "只有 draft 问卷版本可以发布。",
    });
  }

  const nowIso = new Date().toISOString();
  const { data: currentPublishedVersion, error: publishedVersionError } = await admin
    .from("questionnaire_versions")
    .select("id")
    .eq("status", "published")
    .maybeSingle();

  if (publishedVersionError) {
    throw publishedVersionError;
  }

  if (currentPublishedVersion?.id) {
    const { error: archiveError } = await admin
      .from("questionnaire_versions")
      .update({
        status: "archived",
        archived_at: nowIso,
      })
      .eq("id", currentPublishedVersion.id)
      .eq("status", "published");

    if (archiveError) {
      throw archiveError;
    }
  }

  const { error: publishError } = await admin
    .from("questionnaire_versions")
    .update({
      status: "published",
      published_at: nowIso,
      archived_at: null,
    })
    .eq("id", draftVersion.id)
    .eq("status", "draft");

  if (publishError) {
    throw publishError;
  }

  await logQuestionnaireOperation({
    actionType: "questionnaire_published",
    actorUserId: actor.id,
    entityId: draftVersion.id,
    payloadJson: {
      version_no: draftVersion.version_no,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/questionnaires");
  revalidatePath("/app");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/questionnaire");
  revalidatePath("/app/participation");
  redirect(`/admin/questionnaires/${draftVersion.id}`);
}

export async function deleteDraftQuestionnaireAction(formData: FormData) {
  await requireAdminUser();
  const versionId = stringField(formData, "versionId");

  if (!versionId) {
    redirectWithMessage("/admin/questionnaires", {
      error: "缺少待删除的 draft 问卷。",
    });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("questionnaire_versions")
    .delete()
    .eq("id", versionId)
    .eq("status", "draft");

  if (error) {
    throw error;
  }

  revalidatePath("/admin/questionnaires");
  redirect("/admin/questionnaires");
}
