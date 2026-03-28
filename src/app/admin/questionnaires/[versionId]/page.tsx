import { notFound, redirect } from "next/navigation";

import {
  Badge,
  Button,
  ButtonLink,
  FlashToast,
  SectionHeader,
  SurfaceCard,
} from "@/components/site-ui";
import {
  deleteDraftQuestionnaireAction,
  publishQuestionnaireVersionAction,
} from "@/features/admin/questionnaires/actions";
import {
  getQuestionnairePublishingGate,
  getQuestionnaireVersionDetail,
} from "@/features/admin/questionnaires/data";
import { QuestionnaireSections } from "@/features/app/questionnaire-sections";
import { formatDateTime } from "@/lib/site";
import { isUuid } from "@/lib/uuid";

export default async function AdminQuestionnaireVersionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;

  if (!isUuid(resolvedParams.versionId)) {
    redirect("/admin/questionnaires?error=问卷版本链接无效。");
  }

  const [version, gate, resolvedSearchParams] = await Promise.all([
    getQuestionnaireVersionDetail(resolvedParams.versionId),
    getQuestionnairePublishingGate(),
    searchParams,
  ]);

  if (!version) {
    notFound();
  }

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <div className="grid gap-6">
      <FlashToast message={error} />
      <SurfaceCard>
        <SectionHeader
          eyebrow={`问卷版本 V${version.versionNo}`}
          title={version.title}
          description={version.description}
          action={
            <div className="flex flex-wrap gap-3">
              <Badge tone={version.status === "published" ? "success" : "soft"}>
                {version.status}
              </Badge>
              <ButtonLink href="/admin/questionnaires" tone="ghost">
                返回列表
              </ButtonLink>
            </div>
          }
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs tracking-[0.2em]">创建时间</p>
            <p className="mt-3 text-lg">{formatDateTime(version.createdAt)}</p>
          </div>
          <div className="border-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs tracking-[0.2em]">发布时间</p>
            <p className="mt-3 text-lg">
              {version.publishedAt ? formatDateTime(version.publishedAt) : "未发布"}
            </p>
          </div>
        </div>
        {version.status === "draft" ? (
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <form action={deleteDraftQuestionnaireAction}>
              <input type="hidden" name="versionId" value={version.id} />
              <Button tone="soft" type="submit">
                删除 draft
              </Button>
            </form>
            <form action={publishQuestionnaireVersionAction}>
              <input type="hidden" name="versionId" value={version.id} />
              <Button type="submit" disabled={!gate.canManage}>
                发布当前版本
              </Button>
            </form>
          </div>
        ) : null}
        {version.status === "draft" && !gate.canManage && gate.reason ? (
          <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
            当前不能发布：{gate.reason}
          </p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">Matching Policy 摘要</h2>
        <div className="mt-5 grid gap-3">
          {version.matchingPolicySummary.map((item) => (
            <div key={item} className="border-border rounded-2xl border p-4 text-sm">
              {item}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">问卷预览</h2>
        <div className="mt-6 grid gap-8">
          <QuestionnaireSections answers={{}} sections={version.sections} disabled />
        </div>
      </SurfaceCard>
    </div>
  );
}
