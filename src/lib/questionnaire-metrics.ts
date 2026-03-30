import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.generated";

export async function countActiveSubmittedQuestionnaireUsers(
  supabase: SupabaseClient<Database>,
  questionnaireVersionId: string | null,
) {
  if (!questionnaireVersionId) {
    return 0;
  }

  const { data, error } = await supabase.rpc(
    "count_active_submitted_questionnaire_users",
    {
      p_questionnaire_version_id: questionnaireVersionId,
    },
  );

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}
