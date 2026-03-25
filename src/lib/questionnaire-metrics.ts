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

  const { data: submissions, error: submissionsError } = await supabase
    .from("questionnaire_submissions")
    .select("user_id")
    .eq("questionnaire_version_id", questionnaireVersionId)
    .eq("status", "submitted");

  if (submissionsError) {
    throw submissionsError;
  }

  const userIds = [...new Set((submissions ?? []).map((item) => item.user_id))];

  if (userIds.length === 0) {
    return 0;
  }

  const { count, error: activeUsersError } = await supabase
    .from("app_users")
    .select("id", {
      count: "exact",
      head: true,
    })
    .in("id", userIds)
    .neq("account_status", "deleted");

  if (activeUsersError) {
    throw activeUsersError;
  }

  return count ?? 0;
}
