import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getDefaultHomePathForRole,
  type AppRole,
} from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DELETED_ACCOUNT_SESSION_ERROR_MESSAGE = "账号已删除，请重新登录。";
const ACCOUNT_PROVISION_FAILED_ERROR_MESSAGE =
  "账号初始化失败，请重新登录或联系管理员。";

function redirectDeletedAccount(): never {
  redirect(
    `/login?error=${encodeURIComponent(DELETED_ACCOUNT_SESSION_ERROR_MESSAGE)}`,
  );
}

async function signOutAndRedirectProvisionFailure(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<never> {
  await supabase.auth.signOut();
  redirect(
    `/login?error=${encodeURIComponent(ACCOUNT_PROVISION_FAILED_ERROR_MESSAGE)}`,
  );
}

const getSessionAppUserRecord = cache(async (userId: string) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("role, account_status, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return { appUser: data, supabase };
  }

  const { error: provisionError } = await supabase.rpc(
    "provision_current_app_user",
  );

  if (provisionError) {
    return { appUser: null, supabase };
  }

  const { data: provisionedUser, error: refetchError } = await supabase
    .from("app_users")
    .select("role, account_status, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (refetchError) {
    throw refetchError;
  }

  return { appUser: provisionedUser, supabase };
});

export const getSessionUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function getOptionalSessionUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const { appUser, supabase } = await getSessionAppUserRecord(user.id);

  if (!appUser) {
    await signOutAndRedirectProvisionFailure(supabase);
  }

  if (appUser?.account_status === "deleted" || appUser?.deleted_at) {
    await supabase.auth.signOut();
    redirectDeletedAccount();
  }

  return user;
}

export async function getCurrentAppRole(
  userId?: string,
): Promise<AppRole | null> {
  const resolvedUser =
    userId === undefined
      ? await getSessionUser()
      : ({ id: userId } as Pick<User, "id">);

  if (!resolvedUser) {
    return null;
  }

  const { appUser } = await getSessionAppUserRecord(resolvedUser.id);
  return appUser?.role ?? "user";
}

export async function getCurrentSessionHomePath() {
  const user = await getOptionalSessionUser();

  if (!user) {
    return "/login";
  }

  await requireSessionUser();
  const role = await getCurrentAppRole(user.id);
  return role ? getDefaultHomePathForRole(role) : "/app";
}

export async function requireAppUser() {
  const user = await requireSessionUser();
  const role = await getCurrentAppRole(user.id);

  if (role === "admin") {
    redirect("/admin");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();
  const role = await getCurrentAppRole(user.id);

  if (role !== "admin") {
    redirect("/app");
  }

  return user;
}
