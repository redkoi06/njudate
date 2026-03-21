"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getQuestionnaireState } from "@/features/app/data";
import {
  getAuthErrorMessage,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/credentials";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getPublicEnv } from "@/lib/env/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  nickname: z.string().trim().min(1, "请填写昵称"),
  department: z.string().trim().min(1, "请填写院系"),
  major: z.string().trim().min(1, "请填写专业"),
  grade: z.string().trim().min(1, "请填写年级"),
  gender: z.string().trim().min(1, "请填写性别"),
  targetPreference: z.string().trim().min(1, "请填写匹配期待"),
  bio: z.string().trim().max(300, "自我介绍不能超过 300 字").optional(),
  interests: z.string().trim().optional(),
  showNickname: z.boolean(),
});

const settingsSchema = z.object({
  notifyMatchResult: z.boolean(),
  notifyWeeklyReminder: z.boolean(),
  notifyPlatformDigest: z.boolean(),
});

const contactSchema = z.object({
  senderName: z.string().trim().min(1, "请填写称呼"),
  senderEmail: z.string().trim().email("请填写有效邮箱"),
  topic: z.string().trim().min(1, "请填写主题"),
  message: z.string().trim().min(12, "请补充更完整的内容"),
});

const accountRequestTypeSchema = z.enum(["export_data", "delete_account"]);

function redirectWithSearchParams(
  pathname: string,
  params: Record<string, boolean | string | null | undefined>,
): never {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === false) {
      continue;
    }

    searchParams.set(key, value === true ? "1" : value);
  }

  redirect(
    searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname,
  );
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function boolField(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function requireAuthenticatedClient() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function parseInterests(raw: string) {
  return raw
    .split(/[\n,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function parseQuestionnaireAnswers(formData: FormData, userId: string) {
  const questionnaire = await getQuestionnaireState(userId);
  const answers: Record<string, string | string[] | number> = {};

  for (const section of questionnaire.sections) {
    for (const question of section.questions) {
      if (question.kind === "multiple") {
        const values = formData
          .getAll(question.questionCode)
          .flatMap((value) => (typeof value === "string" ? [value] : []))
          .filter(Boolean);

        if (values.length > 0) {
          answers[question.questionCode] = values;
        }

        continue;
      }

      const rawValue = stringField(formData, question.questionCode).trim();

      if (!rawValue) {
        continue;
      }

      if (question.kind === "scale") {
        const numeric = Number(rawValue);
        if (!Number.isNaN(numeric)) {
          answers[question.questionCode] = numeric;
        }

        continue;
      }

      answers[question.questionCode] = rawValue;
    }
  }

  return answers;
}

async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  level: "info" | "success" | "warning";
  sourceType: string;
  sourceId: string | null;
  emailTo?: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      category: input.sourceType,
      title: input.title,
      body: input.body,
      level: input.level,
      source_type: input.sourceType,
      source_id: input.sourceId,
      email_status: input.emailTo ? "pending" : "not_needed",
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  if (!input.emailTo) {
    return;
  }

  const emailResult = await sendTransactionalEmail({
    to: input.emailTo,
    subject: input.title,
    text: input.body,
  });

  await admin
    .from("notifications")
    .update({
      email_status: emailResult.ok ? "sent" : "failed",
      emailed_at: emailResult.ok ? new Date().toISOString() : null,
    })
    .eq("id", data.id);
}

function parseContactPayload(payload: unknown, currentUserId: string) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const left = record.left_user;
  const right = record.right_user;

  if (
    !left ||
    typeof left !== "object" ||
    !right ||
    typeof right !== "object"
  ) {
    return null;
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const counterpart =
    leftRecord.user_id === currentUserId ? rightRecord : leftRecord;

  if (
    typeof leftRecord.user_id !== "string" ||
    typeof leftRecord.nickname !== "string" ||
    typeof leftRecord.email !== "string" ||
    typeof rightRecord.user_id !== "string" ||
    typeof rightRecord.nickname !== "string" ||
    typeof rightRecord.email !== "string" ||
    typeof counterpart.user_id !== "string" ||
    typeof counterpart.nickname !== "string" ||
    typeof counterpart.email !== "string"
  ) {
    return null;
  }

  return {
    left: {
      userId: leftRecord.user_id,
      nickname: leftRecord.nickname,
      email: leftRecord.email,
    },
    right: {
      userId: rightRecord.user_id,
      nickname: rightRecord.nickname,
      email: rightRecord.email,
    },
    counterpart: {
      userId: counterpart.user_id,
      nickname: counterpart.nickname,
      email: counterpart.email,
    },
  };
}

export async function registerUserAction(formData: FormData) {
  const rawEmail = stringField(formData, "email").trim().toLowerCase();
  const payload = signUpSchema.safeParse({
    email: rawEmail,
    password: stringField(formData, "password"),
    confirmPassword: stringField(formData, "confirmPassword"),
  });

  if (!payload.success) {
    return redirectWithSearchParams("/register", {
      email: rawEmail,
      error: getAuthErrorMessage(payload.error, "请检查注册信息。"),
    });
  }

  const env = getPublicEnv();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    options: {
      emailRedirectTo: new URL(
        "/auth/confirm",
        env.NEXT_PUBLIC_SITE_URL,
      ).toString(),
    },
  });

  if (error) {
    return redirectWithSearchParams("/register", {
      email: payload.data.email,
      error: getAuthErrorMessage(error, "注册失败，请稍后再试。"),
    });
  }

  redirectWithSearchParams("/register", {
    email: payload.data.email,
    sent: true,
  });
}

export async function signInWithPasswordAction(formData: FormData) {
  const rawEmail = stringField(formData, "email").trim().toLowerCase();
  const payload = signInSchema.safeParse({
    email: rawEmail,
    password: stringField(formData, "password"),
  });

  if (!payload.success) {
    return redirectWithSearchParams("/login", {
      email: rawEmail,
      error: getAuthErrorMessage(payload.error, "请检查登录信息。"),
    });
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    return redirectWithSearchParams("/login", {
      email: payload.data.email,
      error: getAuthErrorMessage(error, "登录失败，请稍后再试。"),
    });
  }

  redirect("/app/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveProfileAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const payload = profileSchema.parse({
    nickname: stringField(formData, "nickname"),
    department: stringField(formData, "department"),
    major: stringField(formData, "major"),
    grade: stringField(formData, "grade"),
    gender: stringField(formData, "gender"),
    targetPreference: stringField(formData, "targetPreference"),
    bio: stringField(formData, "bio"),
    interests: stringField(formData, "interests"),
    showNickname: boolField(formData, "showNickname"),
  });

  const { error } = await supabase
    .from("app_users")
    .update({
      nickname: payload.nickname,
      department: payload.department,
      major: payload.major,
      grade: payload.grade,
      gender: payload.gender,
      target_preference: payload.targetPreference,
      bio: payload.bio || null,
      interests: parseInterests(payload.interests ?? ""),
      show_nickname: payload.showNickname,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/dashboard");
  redirect("/app/profile");
}

export async function saveQuestionnaireDraftAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const answers = await parseQuestionnaireAnswers(formData, user.id);

  const { error } = await supabase.rpc("save_questionnaire_draft", {
    p_answers_json: answers,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/app/questionnaire");
  revalidatePath("/app/dashboard");
  redirect("/app/questionnaire");
}

export async function submitQuestionnaireAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const answers = await parseQuestionnaireAnswers(formData, user.id);

  const { error } = await supabase.rpc("submit_questionnaire", {
    p_answers_json: answers,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/app/questionnaire");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/participation");
  redirect("/app/questionnaire");
}

export async function joinCurrentBatchAction() {
  const { supabase } = await requireAuthenticatedClient();
  const { error } = await supabase.rpc("join_current_batch");

  if (error) {
    throw error;
  }

  revalidatePath("/app/participation");
  revalidatePath("/app/dashboard");
  redirect("/app/participation");
}

export async function cancelCurrentBatchAction() {
  const { supabase } = await requireAuthenticatedClient();
  const { error } = await supabase.rpc("cancel_current_batch_join");

  if (error) {
    throw error;
  }

  revalidatePath("/app/participation");
  revalidatePath("/app/dashboard");
  redirect("/app/participation");
}

export async function saveSettingsAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const payload = settingsSchema.parse({
    notifyMatchResult: boolField(formData, "notifyMatchResult"),
    notifyWeeklyReminder: boolField(formData, "notifyWeeklyReminder"),
    notifyPlatformDigest: boolField(formData, "notifyPlatformDigest"),
  });

  const { error } = await supabase
    .from("app_users")
    .update({
      notify_match_result: payload.notifyMatchResult,
      notify_weekly_reminder: payload.notifyWeeklyReminder,
      notify_platform_digest: payload.notifyPlatformDigest,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/app/settings");
  redirect("/app/settings");
}

export async function createContactRequestAction(formData: FormData) {
  const payload = contactSchema.parse({
    senderName: stringField(formData, "senderName"),
    senderEmail: stringField(formData, "senderEmail"),
    topic: stringField(formData, "topic"),
    message: stringField(formData, "message"),
  });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("create_service_request", {
    p_request_type: "consultation",
    p_sender_name: payload.senderName,
    p_sender_email: payload.senderEmail,
    p_topic: payload.topic,
    p_message: payload.message,
    p_priority: "normal",
  });

  if (error) {
    throw error;
  }

  redirect("/contact?submitted=1");
}

export async function createAccountRequestAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedClient();
  const requestType = accountRequestTypeSchema.parse(
    stringField(formData, "requestType"),
  );
  const topic =
    requestType === "delete_account" ? "删除账号申请" : "个人数据导出申请";
  const message = stringField(formData, "message");

  const { error } = await supabase.rpc("create_service_request", {
    p_request_type: requestType,
    p_topic: topic,
    p_message: message,
    p_priority: "normal",
  });

  if (error) {
    throw error;
  }

  revalidatePath("/app/settings");
  redirect("/app/settings");
}

export async function triggerMatchContactAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const matchPairId = stringField(formData, "matchPairId");
  const matchResultId = stringField(formData, "matchResultId");

  const { data, error } = await supabase.rpc("trigger_match_contact", {
    p_match_pair_id: matchPairId,
  });

  if (error) {
    throw error;
  }

  const payload = parseContactPayload(data, user.id);
  if (payload) {
    await Promise.all([
      createNotification({
        userId: payload.left.userId,
        title: "联系方式已开放",
        body: `你与 ${payload.right.nickname} 的联系方式已开放，可以通过校内邮箱继续交流。`,
        level: "success",
        sourceType: "match_contact",
        sourceId: matchPairId,
        emailTo: payload.left.email,
      }),
      createNotification({
        userId: payload.right.userId,
        title: "联系方式已开放",
        body: `你与 ${payload.left.nickname} 的联系方式已开放，可以通过校内邮箱继续交流。`,
        level: "success",
        sourceType: "match_contact",
        sourceId: matchPairId,
        emailTo: payload.right.email,
      }),
    ]);
  }

  revalidatePath("/app/matches");
  if (matchResultId) {
    revalidatePath(`/app/matches/${matchResultId}`);
  }
  redirect("/app/matches");
}

export async function markMatchViewedAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedClient();
  const matchResultId = stringField(formData, "matchResultId");

  const { error } = await supabase.rpc("mark_match_result_viewed", {
    p_match_result_id: matchResultId,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/app/matches");
  revalidatePath(`/app/matches/${matchResultId}`);
  redirect(`/app/matches/${matchResultId}`);
}
