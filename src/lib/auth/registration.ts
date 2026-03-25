import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.generated";

export const REGISTRATION_OPEN_CONFIG_KEY = "registration_open";
export const REGISTRATION_OPEN_DESCRIPTION =
  "是否开放新用户注册与邮箱确认。";
export const REGISTRATION_OPEN_DEFAULT = true;

type AppConfigReader = Pick<SupabaseClient<Database>, "from">;

export function parseRegistrationOpenValue(value: unknown) {
  return typeof value === "boolean" ? value : REGISTRATION_OPEN_DEFAULT;
}

export async function readRegistrationOpen(
  supabase: AppConfigReader,
) {
  const { data, error } = await supabase
    .from("app_configs")
    .select("value_json")
    .eq("config_key", REGISTRATION_OPEN_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return parseRegistrationOpenValue(data?.value_json);
}

export async function getRegistrationOpen() {
  return readRegistrationOpen(createAdminSupabaseClient());
}
