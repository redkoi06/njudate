"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import { shanghaiDateTimeInputToIso } from "@/lib/date-time";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/uuid";
import type { Json } from "@/types/database.generated";

function shanghaiDateTimeField(message: string) {
  return z
    .string()
    .trim()
    .refine((value) => shanghaiDateTimeInputToIso(value) !== null, message)
    .transform((value) => shanghaiDateTimeInputToIso(value)!);
}

const announcementSchema = z
  .object({
    announcementId: z.string().uuid().optional(),
    audience: z.enum(["public", "user", "admin", "all"], {
      error: "请选择公告受众",
    }),
    body: z.string().trim().min(1, "请填写公告正文"),
    eyebrow: z.string().trim().min(1, "请填写公告眉题"),
    endsAt: shanghaiDateTimeField("请填写有效的结束时间"),
    startsAt: shanghaiDateTimeField("请填写有效的开始时间"),
    title: z.string().trim().min(1, "请填写公告标题"),
  })
  .superRefine((value, ctx) => {
    if (!(new Date(value.startsAt) < new Date(value.endsAt))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "公告开始时间必须早于结束时间",
        path: ["startsAt"],
      });
    }
  });

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

function requireAnnouncementId(rawAnnouncementId: string) {
  const announcementId = rawAnnouncementId.trim();

  if (!isUuid(announcementId)) {
    redirectWithMessage("/admin/announcements", {
      error: "公告标识无效。",
    });
  }

  return announcementId;
}

async function logAnnouncementOperation(input: {
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
    entity_type: "announcement",
    entity_id: input.entityId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

async function revalidateAnnouncementPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/app/dashboard");
}

export async function saveAnnouncementDraftAction(formData: FormData) {
  const actor = await requireAdminUser();
  const payload = (() => {
    try {
      return announcementSchema.parse({
        announcementId: stringField(formData, "announcementId") || undefined,
        audience: stringField(formData, "audience"),
        body: stringField(formData, "body"),
        eyebrow: stringField(formData, "eyebrow"),
        endsAt: stringField(formData, "endsAt"),
        startsAt: stringField(formData, "startsAt"),
        title: stringField(formData, "title"),
      });
    } catch (error) {
      return redirectWithMessage("/admin/announcements", {
        error: error instanceof Error ? error.message : "公告保存失败。",
      });
    }
  })();

  const admin = createAdminSupabaseClient();

  if (payload.announcementId) {
    const { data: currentAnnouncement, error: currentAnnouncementError } = await admin
      .from("announcements")
      .select("id, status")
      .eq("id", payload.announcementId)
      .maybeSingle();

    if (currentAnnouncementError) {
      throw currentAnnouncementError;
    }

    if (!currentAnnouncement || currentAnnouncement.status !== "draft") {
      redirectWithMessage("/admin/announcements", {
        error: "只有 draft 公告允许编辑。",
      });
    }

    const { error: updateError } = await admin
      .from("announcements")
      .update({
        audience: payload.audience,
        body: payload.body,
        eyebrow: payload.eyebrow,
        ends_at: payload.endsAt,
        starts_at: payload.startsAt,
        title: payload.title,
      })
      .eq("id", payload.announcementId)
      .eq("status", "draft");

    if (updateError) {
      throw updateError;
    }

    await logAnnouncementOperation({
      actionType: "announcement_updated",
      actorUserId: actor.id,
      entityId: payload.announcementId,
    });

    await revalidateAnnouncementPaths();
    redirect("/admin/announcements");
  }

  const { data: createdAnnouncement, error: insertError } = await admin
    .from("announcements")
    .insert({
      audience: payload.audience,
      body: payload.body,
      eyebrow: payload.eyebrow,
      ends_at: payload.endsAt,
      starts_at: payload.startsAt,
      status: "draft",
      title: payload.title,
      created_by: actor.id,
      published_at: null,
      archived_at: null,
    })
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  await logAnnouncementOperation({
    actionType: "announcement_created",
    actorUserId: actor.id,
    entityId: createdAnnouncement.id,
  });

  await revalidateAnnouncementPaths();
  redirect("/admin/announcements");
}

export async function publishAnnouncementAction(formData: FormData) {
  const actor = await requireAdminUser();
  const announcementId = requireAnnouncementId(
    stringField(formData, "announcementId"),
  );

  const admin = createAdminSupabaseClient();
  const { data: currentAnnouncement, error: currentAnnouncementError } = await admin
    .from("announcements")
    .select("id, status")
    .eq("id", announcementId)
    .maybeSingle();

  if (currentAnnouncementError) {
    throw currentAnnouncementError;
  }

  if (!currentAnnouncement || currentAnnouncement.status !== "draft") {
    redirectWithMessage("/admin/announcements", {
      error: "只有 draft 公告允许发布。",
    });
  }

  const nowIso = new Date().toISOString();
  const { error: publishError } = await admin
    .from("announcements")
    .update({
      status: "published",
      published_at: nowIso,
      archived_at: null,
    })
    .eq("id", announcementId)
    .eq("status", "draft");

  if (publishError) {
    throw publishError;
  }

  await logAnnouncementOperation({
    actionType: "announcement_published",
    actorUserId: actor.id,
    entityId: announcementId,
    payloadJson: {
      published_at: nowIso,
    },
  });

  await revalidateAnnouncementPaths();
  redirect("/admin/announcements");
}

export async function archiveAnnouncementAction(formData: FormData) {
  const actor = await requireAdminUser();
  const announcementId = requireAnnouncementId(
    stringField(formData, "announcementId"),
  );

  const admin = createAdminSupabaseClient();
  const { data: currentAnnouncement, error: currentAnnouncementError } = await admin
    .from("announcements")
    .select("id, status")
    .eq("id", announcementId)
    .maybeSingle();

  if (currentAnnouncementError) {
    throw currentAnnouncementError;
  }

  if (!currentAnnouncement || currentAnnouncement.status !== "published") {
    redirectWithMessage("/admin/announcements", {
      error: "只有已发布公告允许归档。",
    });
  }

  const nowIso = new Date().toISOString();
  const { error: archiveError } = await admin
    .from("announcements")
    .update({
      status: "archived",
      archived_at: nowIso,
    })
    .eq("id", announcementId)
    .eq("status", "published");

  if (archiveError) {
    throw archiveError;
  }

  await logAnnouncementOperation({
    actionType: "announcement_archived",
    actorUserId: actor.id,
    entityId: announcementId,
    payloadJson: {
      archived_at: nowIso,
    },
  });

  await revalidateAnnouncementPaths();
  redirect("/admin/announcements");
}
