import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
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

function buildUsersPageHref(page: number, keyword: string) {
  const searchParams = new URLSearchParams();

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  if (keyword) {
    searchParams.set("keyword", keyword);
  }

  return searchParams.size > 0
    ? `/admin/users?${searchParams.toString()}`
    : "/admin/users";
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
  const keyword =
    typeof resolvedSearchParams?.keyword === "string"
      ? resolvedSearchParams.keyword.trim()
      : "";
  const users = await listAdminUsers(pageValue, { keyword });

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="用户管理"
          title="查看账号状态与当前资料情况"
          description={`支持按邮箱或昵称搜索，默认按创建时间倒序展示，每页 ${users.pageSize} 条。${
            users.effectiveQuestionnaireVersionNo
              ? `当前生效问卷版本为 V${users.effectiveQuestionnaireVersionNo}。`
              : "当前没有生效中的问卷版本。"
          }`}
        />
        <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <form
            action="/admin/users"
            className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row"
          >
            <input
              name="keyword"
              type="search"
              defaultValue={keyword}
              placeholder="搜索邮箱或昵称"
              className="border-border bg-background text-foreground focus:border-primary focus:ring-primary/15 w-full rounded-2xl border px-4 py-3 text-sm transition outline-none focus:ring-2"
            />
            <div className="flex gap-2">
              <Button size="sm" type="submit">
                搜索
              </Button>
              {keyword ? (
                <ButtonLink href="/admin/users" size="sm" tone="ghost">
                  清除
                </ButtonLink>
              ) : null}
            </div>
          </form>
          <p className="text-secondary-foreground/80 text-sm leading-7">
            {keyword
              ? `关键词“${keyword}”共命中 ${users.total} 个账号。`
              : `当前共 ${users.total} 个账号。`}
          </p>
        </div>
      </SurfaceCard>

      {users.items.length > 0 ? (
        <SurfaceCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] table-fixed">
              <thead>
                <tr className="text-muted-foreground text-left text-xs tracking-[0.18em]">
                  <th className="border-border bg-background/70 w-[24%] border-b px-5 py-4 font-normal">
                    用户
                  </th>
                  <th className="border-border bg-background/70 w-[24%] border-b px-5 py-4 font-normal">
                    资料
                  </th>
                  <th className="border-border bg-background/70 w-[16%] border-b px-5 py-4 font-normal">
                    当前问卷
                  </th>
                  <th className="border-border bg-background/70 w-[14%] border-b px-5 py-4 font-normal">
                    最近参与
                  </th>
                  <th className="border-border bg-background/70 w-[14%] border-b px-5 py-4 font-normal">
                    账号状态
                  </th>
                  <th className="border-border bg-background/70 w-[8%] border-b px-5 py-4 font-normal">
                    创建时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.items.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="border-border/70 border-b px-5 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm">{user.email ?? "无邮箱"}</p>
                          <Badge>{user.role}</Badge>
                        </div>
                        <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                          昵称 {user.nickname ?? "未填写"}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-5 break-all">
                          {user.id}
                        </p>
                      </div>
                    </td>
                    <td className="border-border/70 border-b px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={user.profileCompleted ? "success" : "warning"}>
                          {user.profileCompleted ? "已完善" : "未完善"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-7">
                        {user.gender ?? "性别未填写"} / {user.grade ?? "年级未填写"} /{" "}
                        {user.department ?? "院系未填写"} / {user.campus ?? "校区未填写"}
                      </p>
                    </td>
                    <td className="border-border/70 border-b px-5 py-4">
                      <p className="text-sm leading-7">{user.questionnaireStatusLabel}</p>
                    </td>
                    <td className="border-border/70 border-b px-5 py-4">
                      <p className="text-sm leading-7">
                        {getRecentParticipationStatusLabel(user.recentParticipationStatus)}
                      </p>
                      <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                        {user.recentParticipationBatchLabel ?? "暂无批次"}
                      </p>
                    </td>
                    <td className="border-border/70 border-b px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={user.accountStatus === "active" ? "soft" : "warning"}>
                          {getAccountStatusLabel(user.accountStatus)}
                        </Badge>
                        {user.isAuthBanned ? (
                          <Badge tone="warning">已禁登</Badge>
                        ) : (
                          <Badge tone="success">可登录</Badge>
                        )}
                      </div>
                      <p className="text-secondary-foreground/80 mt-2 text-xs leading-6">
                        {user.deletedAt
                          ? `软删除于 ${formatDateTime(user.deletedAt)}`
                          : "未软删除"}
                      </p>
                      <p className="text-secondary-foreground/80 mt-1 text-xs leading-6">
                        {user.isAuthBanned && user.bannedUntil
                          ? `禁登至 ${formatDateTime(user.bannedUntil)}`
                          : "当前未被禁登"}
                      </p>
                    </td>
                    <td className="border-border/70 border-b px-5 py-4">
                      <p className="text-sm leading-7 whitespace-nowrap">
                        {formatDateTime(user.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      ) : (
        <EmptyState
          title={keyword ? "没有匹配的用户" : "还没有用户"}
          description={
            keyword
              ? `没有找到与“${keyword}”匹配的邮箱或昵称。`
              : "当前还没有可展示的账号记录。"
          }
        />
      )}

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-secondary-foreground/80 text-sm leading-7">
            第 {users.page} / {users.totalPages} 页，共 {users.total} 个账号。
          </p>
          <div className="flex gap-3">
            {users.page > 1 ? (
              <ButtonLink
                href={buildUsersPageHref(users.page - 1, keyword)}
                tone="soft"
              >
                上一页
              </ButtonLink>
            ) : null}
            {users.page < users.totalPages ? (
              <ButtonLink href={buildUsersPageHref(users.page + 1, keyword)}>
                下一页
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
