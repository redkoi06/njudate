import {
  Badge,
  ButtonLink,
  EmptyState,
  FlashToast,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import {
  getQuestionnairePublishingGate,
  listQuestionnaireVersions,
} from "@/features/admin/questionnaires/data";
import { formatDateTime } from "@/lib/site";

export default async function AdminQuestionnairesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [versions, gate, resolvedSearchParams] = await Promise.all([
    listQuestionnaireVersions(),
    getQuestionnairePublishingGate(),
    searchParams,
  ]);

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <div className="grid gap-6">
      <FlashToast message={error} />
      <SurfaceCard>
        <SectionHeader
          eyebrow="问卷版本"
          title="导入、预览并发布问卷版本"
          description="后台固定只接受 JSON 粘贴导入。系统内始终只保留一个 draft；发布时会把旧 published 归档，新版本成为唯一 published。"
          action={
            <ButtonLink
              href="/admin/questionnaires/import"
              tone={gate.canManage ? "primary" : "soft"}
            >
              导入新问卷
            </ButtonLink>
          }
        />
        {!gate.canManage && gate.reason ? (
          <p className="text-secondary-foreground/80 mt-6 text-sm leading-7">
            当前不可导入或发布问卷：{gate.reason}
          </p>
        ) : null}
      </SurfaceCard>

      {versions.length === 0 ? (
        <EmptyState
          title="还没有问卷版本"
          description="先从后台导入第一版问卷 JSON，系统才会生成可预览、可发布的 draft。"
          action={<ButtonLink href="/admin/questionnaires/import">立即导入</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4">
          {versions.map((version) => (
            <SurfaceCard key={version.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xl">{version.title}</p>
                    <Badge tone={version.status === "published" ? "success" : "soft"}>
                      {version.status}
                    </Badge>
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    版本号 V{version.versionNo}，创建于 {formatDateTime(version.createdAt)}
                    {version.publishedAt
                      ? `，发布于 ${formatDateTime(version.publishedAt)}`
                      : ""}
                    {version.archivedAt
                      ? `，归档于 ${formatDateTime(version.archivedAt)}`
                      : ""}
                    。
                  </p>
                </div>
                <ButtonLink href={`/admin/questionnaires/${version.id}`} tone="soft">
                  查看详情
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
