"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  REGISTRATION_OPEN_CONFIG_KEY,
  REGISTRATION_OPEN_DESCRIPTION,
} from "@/lib/auth/registration";
import { requireAdminUser } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

const matchScheduleSchema = z.object({
  value: z.string().trim().min(1, "请填写匹配时间说明"),
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

async function logConfigOperation(input: {
  actorUserId: string;
  configKey: string;
  payloadJson?: Json;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("operation_logs").insert({
    actor_role: "admin",
    actor_user_id: input.actorUserId,
    action_type: "config_updated",
    entity_type: "app_config",
    entity_id: input.configKey,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function updateMatchScheduleTextAction(formData: FormData) {
  const actor = await requireAdminUser();
  const payload = (() => {
    try {
      return matchScheduleSchema.parse({
        value: stringField(formData, "value"),
      });
    } catch (error) {
      return redirectWithMessage("/admin/configs", {
        error: error instanceof Error ? error.message : "配置保存失败。",
      });
    }
  })();

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("app_configs").upsert(
    {
      config_key: "match_schedule_text",
      description: "首页展示的匹配时间说明。",
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
      value_json: payload.value,
    },
    {
      onConflict: "config_key",
    },
  );

  if (error) {
    throw error;
  }

  await logConfigOperation({
    actorUserId: actor.id,
    configKey: "match_schedule_text",
    payloadJson: {
      config_key: "match_schedule_text",
      value: payload.value,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/configs");
  revalidatePath("/login");
  revalidatePath("/register");
  redirect("/admin/configs");
}

export async function updateRegistrationOpenAction(formData: FormData) {
  const actor = await requireAdminUser();
  const admin = createAdminSupabaseClient();
  const value = formData.get("registrationOpen") === "on";
  const { error } = await admin.from("app_configs").upsert(
    {
      config_key: REGISTRATION_OPEN_CONFIG_KEY,
      description: REGISTRATION_OPEN_DESCRIPTION,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
      value_json: value,
    },
    {
      onConflict: "config_key",
    },
  );

  if (error) {
    throw error;
  }

  await logConfigOperation({
    actorUserId: actor.id,
    configKey: REGISTRATION_OPEN_CONFIG_KEY,
    payloadJson: {
      config_key: REGISTRATION_OPEN_CONFIG_KEY,
      value,
    },
  });

  revalidatePath("/admin/configs");
  revalidatePath("/login");
  revalidatePath("/register");
  redirect("/admin/configs");
}
