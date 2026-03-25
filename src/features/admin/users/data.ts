import "server-only";

import { isProfileCompleted } from "@/features/app/profile-contract";
import {
  getEffectiveQuestionnaireContext,
  getQuestionnaireStateStatus,
} from "@/features/app/questionnaire-runtime";
import { getQuestionnaireSubmissionStatusLabel } from "@/lib/site";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.generated";

export type AdminUserListItem = {
  accountStatus: "active" | "restricted" | "deleted";
  bannedUntil: string | null;
  campus: string | null;
  createdAt: string;
  deletedAt: string | null;
  department: string | null;
  email: string | null;
  gender: string | null;
  grade: string | null;
  id: string;
  isAuthBanned: boolean;
  nickname: string | null;
  profileCompleted: boolean;
  questionnaireStatusLabel: string;
  recentParticipationBatchLabel: string | null;
  recentParticipationStatus: "joined" | "cancelled" | "locked" | null;
  role: "user" | "admin";
};

export type AdminUsersPageData = {
  effectiveQuestionnaireVersionNo: number | null;
  items: AdminUserListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type AppUserRow = Pick<
  Database["public"]["Tables"]["app_users"]["Row"],
  | "account_status"
  | "birth_year"
  | "campus"
  | "created_at"
  | "deleted_at"
  | "department"
  | "gender"
  | "grade"
  | "id"
  | "nickname"
  | "role"
>;

type ParticipationRow = {
  batch_id: string;
  status: "joined" | "cancelled" | "locked";
  updated_at: string;
  user_id: string;
};

const ADMIN_USER_COLUMNS =
  "id, role, account_status, nickname, gender, grade, department, campus, birth_year, deleted_at, created_at";
const AUTH_USER_SEARCH_PAGE_SIZE = 500;

export function getRecentParticipationStatusLabel(
  status: AdminUserListItem["recentParticipationStatus"],
) {
  switch (status) {
    case "joined":
      return "已报名";
    case "locked":
      return "已锁定";
    case "cancelled":
      return "已退出";
    case null:
      return "暂无记录";
  }
}

async function findAuthUserIdsByKeyword(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return [];
  }

  const matchedUserIds = new Set<string>();

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USER_SEARCH_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (user.email?.toLowerCase().includes(normalizedKeyword)) {
        matchedUserIds.add(user.id);
      }
    }

    if (data.users.length < AUTH_USER_SEARCH_PAGE_SIZE) {
      return [...matchedUserIds];
    }
  }
}

export async function listAdminUsers(
  page: number,
  input?: {
    keyword?: string;
    pageSize?: number;
  },
) {
  const admin = createAdminSupabaseClient();
  const pageSize = input?.pageSize ?? 50;
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const keyword = input?.keyword?.trim() ?? "";
  let users: AppUserRow[] = [];
  let total = 0;
  let questionnaireContext: Awaited<ReturnType<typeof getEffectiveQuestionnaireContext>>;

  if (keyword) {
    const [matchedAuthUserIds, nicknameResult, resolvedQuestionnaireContext] =
      await Promise.all([
        findAuthUserIdsByKeyword(admin, keyword),
        admin.from("app_users").select("id").ilike("nickname", `%${keyword}%`),
        getEffectiveQuestionnaireContext(admin),
      ]);

    if (nicknameResult.error) {
      throw nicknameResult.error;
    }

    const matchedUserIds = [
      ...new Set([
        ...matchedAuthUserIds,
        ...(nicknameResult.data ?? []).map((item) => item.id),
      ]),
    ];

    questionnaireContext = resolvedQuestionnaireContext;
    total = matchedUserIds.length;

    if (matchedUserIds.length > 0) {
      const usersResult = await admin
        .from("app_users")
        .select(ADMIN_USER_COLUMNS)
        .in("id", matchedUserIds)
        .order("created_at", { ascending: false })
        .range(rangeFrom, rangeTo);

      if (usersResult.error) {
        throw usersResult.error;
      }

      users = (usersResult.data ?? []) as AppUserRow[];
    }
  } else {
    const [usersResult, countResult, resolvedQuestionnaireContext] = await Promise.all([
      admin
        .from("app_users")
        .select(ADMIN_USER_COLUMNS)
        .order("created_at", { ascending: false })
        .range(rangeFrom, rangeTo),
      admin.from("app_users").select("id", { head: true, count: "exact" }),
      getEffectiveQuestionnaireContext(admin),
    ]);

    if (usersResult.error) {
      throw usersResult.error;
    }

    if (countResult.error) {
      throw countResult.error;
    }

    users = (usersResult.data ?? []) as AppUserRow[];
    total = countResult.count ?? 0;
    questionnaireContext = resolvedQuestionnaireContext;
  }

  const userIds = users.map((item) => item.id);

  const [submissionResult, participationResult] = await Promise.all([
    questionnaireContext && userIds.length > 0
      ? admin
          .from("questionnaire_submissions")
          .select("user_id, status, submission_no")
          .eq("questionnaire_version_id", questionnaireContext.versionId)
          .in("user_id", userIds)
          .order("submission_no", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    userIds.length > 0
      ? admin
          .from("batch_participations")
          .select("user_id, batch_id, status, updated_at")
          .in("user_id", userIds)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (submissionResult.error) {
    throw submissionResult.error;
  }

  if (participationResult.error) {
    throw participationResult.error;
  }

  const latestParticipationByUserId = new Map<string, ParticipationRow>();
  for (const participation of (participationResult.data ?? []) as ParticipationRow[]) {
    if (!latestParticipationByUserId.has(participation.user_id)) {
      latestParticipationByUserId.set(participation.user_id, participation);
    }
  }

  const batchIds = [
    ...new Set([...latestParticipationByUserId.values()].map((item) => item.batch_id)),
  ];
  const { data: batches, error: batchesError } = batchIds.length
    ? await admin.from("match_batches").select("id, label").in("id", batchIds)
    : { data: [], error: null };

  if (batchesError) {
    throw batchesError;
  }

  const batchLabelById = new Map((batches ?? []).map((item) => [item.id, item.label]));

  const submissionsByUserId = new Map<
    string,
    { hasDraft: boolean; hasSubmitted: boolean }
  >();

  for (const submission of submissionResult.data ?? []) {
    const current = submissionsByUserId.get(submission.user_id) ?? {
      hasDraft: false,
      hasSubmitted: false,
    };

    if (submission.status === "draft") {
      current.hasDraft = true;
    }

    if (submission.status === "submitted") {
      current.hasSubmitted = true;
    }

    submissionsByUserId.set(submission.user_id, current);
  }

  const authUsers = await Promise.all(
    users.map(async (user) => {
      const { data, error } = await admin.auth.admin.getUserById(user.id);

      if (error) {
        throw error;
      }

      return [user.id, data.user ?? null] as const;
    }),
  );

  const authUserById = new Map(authUsers);

  return {
    effectiveQuestionnaireVersionNo: questionnaireContext?.versionNo ?? null,
    items: users.map((user) => {
      const questionnaireStatus = questionnaireContext
        ? getQuestionnaireStateStatus(
            submissionsByUserId.get(user.id) ?? {
              hasDraft: false,
              hasSubmitted: false,
            },
          )
        : null;
      const latestParticipation = latestParticipationByUserId.get(user.id) ?? null;
      const authUser = authUserById.get(user.id) ?? null;
      const bannedUntil = authUser?.banned_until ?? null;
      const isAuthBanned =
        typeof bannedUntil === "string" &&
        !Number.isNaN(new Date(bannedUntil).getTime()) &&
        new Date(bannedUntil).getTime() > Date.now();

      return {
        accountStatus: user.account_status,
        bannedUntil,
        campus: user.campus,
        createdAt: user.created_at,
        deletedAt: user.deleted_at,
        department: user.department,
        email: authUser?.email ?? null,
        gender: user.gender,
        grade: user.grade,
        id: user.id,
        isAuthBanned,
        nickname: user.nickname,
        profileCompleted: isProfileCompleted({
          birthYear: user.birth_year,
          campus: user.campus ?? "",
          department: user.department ?? "",
          gender: user.gender ?? "",
          grade: user.grade ?? "",
          nickname: user.nickname ?? "",
        }),
        questionnaireStatusLabel: questionnaireStatus
          ? getQuestionnaireSubmissionStatusLabel(questionnaireStatus)
          : "暂无生效问卷",
        recentParticipationBatchLabel: latestParticipation
          ? batchLabelById.get(latestParticipation.batch_id) ?? null
          : null,
        recentParticipationStatus: latestParticipation?.status ?? null,
        role: user.role,
      } satisfies AdminUserListItem;
    }),
    page: currentPage,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  } satisfies AdminUsersPageData;
}
