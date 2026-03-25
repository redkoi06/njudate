import "server-only";

import { MATCH_SCHEDULE_TEXT } from "@/lib/site";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminConfigItem = {
  description: string;
  key: "match_schedule_text";
  value: string;
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
