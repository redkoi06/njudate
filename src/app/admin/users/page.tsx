import { Badge, ButtonLink, EmptyState, SectionHeader, SurfaceCard } from "@/components/site-ui";
import {
  getRecentParticipationStatusLabel,
  listAdminUsers,
} from "@/features/admin/users/data";
import { formatDateTime } from "@/lib/site";

function getAccountStatusLabel(status: "active" | "restricted" | "deleted") {
  switch (status) {
    case "active":
      return "正常";
    case "restricted":
      return "受限";
    case "deleted":
      return "已软删除";
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageValue =
    typeof resolvedSearchParams?.page === "string"
      ? Number(resolvedSearchParams.page)
      : 1;
  const users = await listAdminUsers(pageValue);

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="用户管理"
          title="查看账号状态与当前资料情况"
          description={`当前按创建时间倒序展示，每页 ${users.pageSize} 条。${
            users.effectiveQuestionnaireVersionNo
              ? `当前生效问卷版本为 V${users.effectiveQuestionnaireVersionNo}。`
              : "当前没有生效中的问卷版本。"
          }`}
        />
      </SurfaceCard>

      {users.items.length > 0 ? (
        <div className="grid gap-4">
          {users.items.map((user) => (
            <SurfaceCard key={user.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg">{user.email ?? "无邮箱"}</p>
                    <Badge>{user.role}</Badge>
                    <Badge tone={user.accountStatus === "deleted" ? "warning" : "soft"}>
                      {getAccountStatusLabel(user.accountStatus)}
                    </Badge>
                    {user.isAuthBanned ? (
                      <Badge tone="warning">已禁登</Badge>
                    ) : (
                      <Badge tone="success">可登录</Badge>
                    )}
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    昵称 {user.nickname ?? "未填写"} / 性别 {user.gender ?? "未填写"} / 年级{" "}
                    {user.grade ?? "未填写"} / 院系 {user.department ?? "未填写"} / 校区{" "}
                    {user.campus ?? "未填写"}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="border-border rounded-2xl border p-4 text-sm">
                      <p className="text-muted-foreground text-xs tracking-[0.2em]">
                        资料完成状态
                      </p>
                      <p className="mt-3">
                        {user.profileCompleted ? "已完善" : "未完善"}
                      </p>
                    </div>
                    <div className="border-border rounded-2xl border p-4 text-sm">
                      <p className="text-muted-foreground text-xs tracking-[0.2em]">
                        当前生效问卷
                      </p>
                      <p className="mt-3">{user.questionnaireStatusLabel}</p>
                    </div>
                    <div className="border-border rounded-2xl border p-4 text-sm">
                      <p className="text-muted-foreground text-xs tracking-[0.2em]">
                        最近参与状态
                      </p>
                      <p className="mt-3">
                        {getRecentParticipationStatusLabel(user.recentParticipationStatus)}
                      </p>
                      {user.recentParticipationBatchLabel ? (
                        <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                          {user.recentParticipationBatchLabel}
                        </p>
                      ) : null}
                    </div>
                    <div className="border-border rounded-2xl border p-4 text-sm">
                      <p className="text-muted-foreground text-xs tracking-[0.2em]">
                        账号状态
                      </p>
                      <p className="mt-3">
                        {user.deletedAt ? `软删除于 ${formatDateTime(user.deletedAt)}` : "未删除"}
                      </p>
                      <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                        {user.isAuthBanned && user.bannedUntil
                          ? `禁登至 ${formatDateTime(user.bannedUntil)}`
                          : "当前未被禁登"}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-secondary-foreground/80 shrink-0 text-sm leading-7">
                  创建时间：{formatDateTime(user.createdAt)}
                </p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="还没有用户"
          description="当前还没有可展示的账号记录。"
        />
      )}

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary-foreground/80 text-sm leading-7">
            第 {users.page} / {users.totalPages} 页，共 {users.total} 个账号。
          </p>
          <div className="flex gap-3">
            {users.page > 1 ? (
              <ButtonLink href={`/admin/users?page=${users.page - 1}`} tone="soft">
                上一页
              </ButtonLink>
            ) : null}
            {users.page < users.totalPages ? (
              <ButtonLink href={`/admin/users?page=${users.page + 1}`}>
                下一页
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
