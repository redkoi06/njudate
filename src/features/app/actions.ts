"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getQuestionnaireState } from "@/features/app/data";
import {
  PROFILE_CAMPUS_OPTIONS,
  PROFILE_DEPARTMENT_OPTIONS,
  PROFILE_GENDER_OPTIONS,
  PROFILE_GRADE_OPTIONS,
  getBirthYearRange,
  normalizeDepartmentForGrade,
} from "@/features/app/profile-contract";
import {
  getAuthErrorMessage,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/credentials";
import { getRegistrationOpen } from "@/lib/auth/registration";
import { getDefaultHomePathForRole } from "@/lib/auth/permissions";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getPublicEnv } from "@/lib/env/client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";

function buildProfileSchema() {
  const { minBirthYear, maxBirthYear } = getBirthYearRange();

  return z.object({
    nickname: z.string().trim().min(1, "请填写昵称"),
    gender: z.enum(PROFILE_GENDER_OPTIONS, {
      error: "请选择性别",
    }),
    grade: z.enum(PROFILE_GRADE_OPTIONS, {
      error: "请选择年级",
    }),
    department: z.enum(PROFILE_DEPARTMENT_OPTIONS, {
      error: "请选择院系",
    }),
    campus: z.enum(PROFILE_CAMPUS_OPTIONS, {
      error: "请选择所在校区",
    }),
    birthYear: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "出生年份必须是四位数字")
      .transform((value) => Number(value))
      .refine(
        (value) => value >= minBirthYear && value <= maxBirthYear,
        `出生年份必须在 ${minBirthYear} 到 ${maxBirthYear} 之间`,
      ),
  });
}

const settingsSchema = z.object({
  notifyMatchResult: z.boolean(),
});

const deleteAccountResultSchema = z.object({
  userId: z.string().uuid(),
  cancelledParticipationIds: z.array(z.string().uuid()).default([]),
});

const INVALID_LOGIN_CREDENTIALS_MESSAGE = "Invalid login credentials";
const UNREGISTERED_LOGIN_ERROR_MESSAGE = "此邮箱未注册，请先注册";
const REGISTERED_EMAIL_ERROR_MESSAGE = "该邮箱已注册，请直接登录。";
const RESEND_CONFIRMATION_SUCCESS_MESSAGE =
  "该邮箱已注册，确认邮件已重新发送，请查收邮箱完成确认。";
const RESEND_CONFIRMATION_FAILURE_MESSAGE =
  "该邮箱已注册，但确认邮件重发失败，请稍后再试。";

type AuthRegistrationStatus =
  | "not_found"
  | "registered_confirmed"
  | "registered_unconfirmed";

const DELETED_ACCOUNT_LOGIN_ERROR_MESSAGE = "账号已删除，无法登录。";
const DELETED_ACCOUNT_SESSION_ERROR_MESSAGE = "账号已删除，请重新登录。";

type AppAccountStatus = "active" | "restricted" | "deleted";

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

  const { data: appUser, error: appUserError } = await supabase
    .from("app_users")
    .select("role, account_status, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (appUserError) {
    throw appUserError;
  }

  if (appUser?.role === "admin") {
    redirect("/admin");
  }

  if (appUser?.account_status === "deleted" || appUser?.deleted_at) {
    await supabase.auth.signOut();
    redirectWithSearchParams("/login", {
      error: DELETED_ACCOUNT_SESSION_ERROR_MESSAGE,
    });
  }

  return { supabase, user };
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

  void sendTransactionalEmail({
    to: input.emailTo,
    subject: input.title,
    text: input.body,
  })
    .then(async (emailResult) => {
      const { error: updateError } = await admin
        .from("notifications")
        .update({
          email_status: emailResult.ok ? "sent" : "failed",
          emailed_at: emailResult.ok ? new Date().toISOString() : null,
        })
        .eq("id", data.id);

      if (updateError) {
        console.error("Failed to update notification email status", updateError);
      }
    })
    .catch((error) => {
      console.error("Background email send failed", error);
    });
}

async function getPublishedMatchRoundNo(input: {
  matchResultId: string;
  userId: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: matchResult, error: matchResultError } = await supabase
    .from("match_results")
    .select("batch_id")
    .eq("id", input.matchResultId)
    .eq("user_id", input.userId)
    .not("released_at", "is", null)
    .maybeSingle();

  if (matchResultError) {
    throw matchResultError;
  }

  if (!matchResult?.batch_id) {
    throw new Error("匹配结果不存在或尚未发布。");
  }

  const { data: batch, error: batchError } = await supabase
    .from("match_batches")
    .select("round_no, status")
    .eq("id", matchResult.batch_id)
    .single();

  if (batchError) {
    throw batchError;
  }

  if (batch.status !== "published") {
    throw new Error("匹配结果所属批次尚未发布。");
  }

  return batch.round_no;
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

function isInvalidLoginCredentialsError(error: unknown) {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return false;
  }

  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    message.includes(INVALID_LOGIN_CREDENTIALS_MESSAGE)
  );
}

async function getAuthRegistrationStatus(
  email: string,
): Promise<AuthRegistrationStatus> {
  const lookup = await getAuthUserLookup(email);
  return lookup.registrationStatus;
}

async function getAuthUserLookup(email: string): Promise<{
  accountStatus: AppAccountStatus | null;
  registrationStatus: AuthRegistrationStatus;
  userId: string | null;
}> {
  const admin = createAdminSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data: authRows, error: authError } = await admin.rpc(
    "lookup_auth_user_by_email" as never,
    { p_email: normalizedEmail } as never,
  );

  if (authError) {
    throw authError;
  }

  const authRow = (
    (authRows ?? []) as Array<{
      email_confirmed_at: string | null;
      user_id: string;
    }>
  )[0];

  if (!authRow) {
    return {
      accountStatus: null,
      registrationStatus: "not_found",
      userId: null,
    };
  }

  const { data: appUser, error: appUserError } = await admin
    .from("app_users")
    .select("account_status")
    .eq("id", authRow.user_id)
    .maybeSingle();

  if (appUserError) {
    throw appUserError;
  }

  return {
    accountStatus: (appUser?.account_status ?? null) as AppAccountStatus | null,
    registrationStatus: authRow.email_confirmed_at
      ? "registered_confirmed"
      : "registered_unconfirmed",
    userId: authRow.user_id,
  };
}

function getActionErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.trim().length > 0
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
}

async function writeAccountOperationLog(input: {
  actionType: string;
  payloadJson?: Json;
  userId: string;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("operation_logs").insert({
    actor_role: "system",
    actor_user_id: input.userId,
    target_user_id: input.userId,
    action_type: input.actionType,
    entity_type: "app_user",
    entity_id: input.userId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    console.error("Failed to write account operation log", error);
  }
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

  if (!(await getRegistrationOpen())) {
    redirect("/login");
  }

  const env = getPublicEnv();
  const emailRedirectTo = new URL(
    "/auth/confirm",
    env.NEXT_PUBLIC_SITE_URL,
  ).toString();
  const registrationStatus = await getAuthRegistrationStatus(
    payload.data.email,
  );

  if (registrationStatus === "registered_confirmed") {
    return redirectWithSearchParams("/register", {
      email: payload.data.email,
      error: REGISTERED_EMAIL_ERROR_MESSAGE,
    });
  }

  const supabase = await createServerSupabaseClient();
  if (registrationStatus === "registered_unconfirmed") {
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: payload.data.email,
      options: {
        emailRedirectTo,
      },
    });

    return redirectWithSearchParams("/register", {
      email: payload.data.email,
      error: resendError
        ? RESEND_CONFIRMATION_FAILURE_MESSAGE
        : RESEND_CONFIRMATION_SUCCESS_MESSAGE,
    });
  }

  const { error } = await supabase.auth.signUp({
    email: payload.data.email,
    password: payload.data.password,
    options: {
      emailRedirectTo,
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

  const lookup = await getAuthUserLookup(payload.data.email);
  if (lookup.accountStatus === "deleted") {
    return redirectWithSearchParams("/login", {
      email: payload.data.email,
      error: DELETED_ACCOUNT_LOGIN_ERROR_MESSAGE,
    });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    if (isInvalidLoginCredentialsError(error)) {
      if (lookup.registrationStatus === "not_found") {
        return redirectWithSearchParams("/login", {
          email: payload.data.email,
          error: UNREGISTERED_LOGIN_ERROR_MESSAGE,
        });
      }
    }

    return redirectWithSearchParams("/login", {
      email: payload.data.email,
      error: getAuthErrorMessage(error, "登录失败，请稍后再试。"),
    });
  }

  const roleResult = data.user
    ? await supabase
        .from("app_users")
        .select("role, account_status, deleted_at")
        .eq("id", data.user.id)
        .maybeSingle()
    : null;

  if (roleResult?.error) {
    throw roleResult.error;
  }

  if (
    roleResult?.data?.account_status === "deleted" ||
    roleResult?.data?.deleted_at
  ) {
    await supabase.auth.signOut();
    return redirectWithSearchParams("/login", {
      email: payload.data.email,
      error: DELETED_ACCOUNT_LOGIN_ERROR_MESSAGE,
    });
  }

  redirect(getDefaultHomePathForRole(roleResult?.data?.role ?? "user"));
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveProfileAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const payload = buildProfileSchema().parse({
    nickname: stringField(formData, "nickname"),
    gender: stringField(formData, "gender"),
    grade: stringField(formData, "grade"),
    department: stringField(formData, "department"),
    campus: stringField(formData, "campus"),
    birthYear: stringField(formData, "birthYear"),
  });
  const department = normalizeDepartmentForGrade(
    payload.grade,
    payload.department,
  );

  const { error } = await supabase
    .from("app_users")
    .update({
      nickname: payload.nickname,
      gender: payload.gender,
      grade: payload.grade,
      department,
      campus: payload.campus,
      birth_year: payload.birthYear,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/app/profile");
  revalidatePath("/app");
  revalidatePath("/app/dashboard");
  redirect("/app");
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
  revalidatePath("/app");
  revalidatePath("/app/dashboard");
  redirectWithSearchParams("/app/questionnaire", {
    draftSaved: true,
  });
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
  revalidatePath("/app");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/participation");
  redirectWithSearchParams("/app/questionnaire", {
    questionnaireSubmitted: true,
  });
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
  });

  const { error } = await supabase
    .from("app_users")
    .update({
      notify_match_result: payload.notifyMatchResult,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/app/settings");
  redirect("/app/settings");
}

export async function deleteOwnAccountAction() {
  const { supabase, user } = await requireAuthenticatedClient();
  const { data, error } = await supabase.rpc("delete_my_account");

  if (error) {
    return redirectWithSearchParams("/app/settings", {
      accountError: getActionErrorMessage(error, "删除账号失败，请稍后再试。"),
    });
  }

  const deleteResult = deleteAccountResultSchema.parse(data);
  const admin = createAdminSupabaseClient();
  const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
    ban_duration: "876000h",
  });

  if (banError) {
    const { error: rollbackError } = await admin.rpc(
      "rollback_delete_my_account",
      {
        p_user_id: deleteResult.userId,
        p_cancelled_participation_ids: deleteResult.cancelledParticipationIds,
      },
    );

    if (rollbackError) {
      await writeAccountOperationLog({
        actionType: "account_delete_rollback_failed",
        userId: deleteResult.userId,
        payloadJson: {
          auth_error_message: getActionErrorMessage(
            banError,
            "Auth ban failed during account deletion.",
          ),
          cancelled_participation_ids: deleteResult.cancelledParticipationIds,
          rollback_error_message: getActionErrorMessage(
            rollbackError,
            "Account delete rollback failed.",
          ),
        },
      });
    } else {
      await writeAccountOperationLog({
        actionType: "account_delete_rolled_back_after_auth_ban_failure",
        userId: deleteResult.userId,
        payloadJson: {
          auth_error_message: getActionErrorMessage(
            banError,
            "Auth ban failed during account deletion.",
          ),
          cancelled_participation_ids: deleteResult.cancelledParticipationIds,
        },
      });
    }
  }

  await supabase.auth.signOut();
  redirect("/");
}

export async function triggerMatchContactAction(formData: FormData) {
  const { supabase, user } = await requireAuthenticatedClient();
  const matchPairId = stringField(formData, "matchPairId");
  const matchResultId = stringField(formData, "matchResultId");
  const roundNo = await getPublishedMatchRoundNo({
    matchResultId,
    userId: user.id,
  });

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
        title: `第 ${roundNo} 轮联系方式已开放`,
        body: `你与 ${payload.right.nickname} 的联系方式已开放，可以通过校内邮箱继续交流。`,
        level: "success",
        sourceType: "match_contact",
        sourceId: matchPairId,
        emailTo: payload.left.email,
      }),
      createNotification({
        userId: payload.right.userId,
        title: `第 ${roundNo} 轮联系方式已开放`,
        body: `你与 ${payload.left.nickname} 的联系方式已开放，可以通过校内邮箱继续交流。`,
        level: "success",
        sourceType: "match_contact",
        sourceId: matchPairId,
        emailTo: payload.right.email,
      }),
    ]);
  }

  revalidatePath("/app/matches");
  revalidatePath(`/app/matches/${matchResultId}`);
  redirect(`/app/matches/${matchResultId}`);
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

export async function markNotificationReadAction(formData: FormData) {
  const { supabase } = await requireAuthenticatedClient();
  const notificationId = stringField(formData, "notificationId");

  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/app/dashboard");
  redirect("/app/dashboard");
}
