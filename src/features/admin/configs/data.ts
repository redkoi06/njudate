import "server-only";

import {
  REGISTRATION_OPEN_CONFIG_KEY,
  REGISTRATION_OPEN_DEFAULT,
  REGISTRATION_OPEN_DESCRIPTION,
  parseRegistrationOpenValue,
} from "@/lib/auth/registration";
import { MATCH_SCHEDULE_TEXT } from "@/lib/site";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminConfigItem = {
  description: string;
  key: "match_schedule_text";
  value: string;
};

export type RegistrationOpenConfigItem = {
  description: string;
  key: typeof REGISTRATION_OPEN_CONFIG_KEY;
  value: boolean;
};

const MATCH_SCHEDULE_DESCRIPTION = "首页展示的匹配时间说明。";

export async function getMatchScheduleConfig() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("app_configs")
    .select("config_key, value_json, description")
    .eq("config_key", "match_schedule_text")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    description: data?.description ?? MATCH_SCHEDULE_DESCRIPTION,
    key: "match_schedule_text",
    value:
      typeof data?.value_json === "string" ? data.value_json : MATCH_SCHEDULE_TEXT,
  } satisfies AdminConfigItem;
}

export async function getRegistrationOpenConfig() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("app_configs")
    .select("config_key, value_json, description")
    .eq("config_key", REGISTRATION_OPEN_CONFIG_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    description: data?.description ?? REGISTRATION_OPEN_DESCRIPTION,
    key: REGISTRATION_OPEN_CONFIG_KEY,
    value: parseRegistrationOpenValue(data?.value_json ?? REGISTRATION_OPEN_DEFAULT),
  } satisfies RegistrationOpenConfigItem;
}
