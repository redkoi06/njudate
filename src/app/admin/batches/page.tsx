import {
  Button,
  ButtonLink,
  EmptyState,
  Field,
  SectionHeader,
  SelectField,
  SurfaceCard,
  TextArea,
} from "@/components/site-ui";
import { createBatchAction } from "@/features/admin/batches/actions";
import {
  listBatches,
  listPublishedQuestionnaireOptions,
} from "@/features/admin/batches/data";
import { formatDateTime } from "@/lib/site";

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [batches, publishedQuestionnaires, resolvedSearchParams] =
    await Promise.all([
      listBatches(),
      listPublishedQuestionnaireOptions(),
      searchParams,
    ]);

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="批次运营"
          title="创建并推进每周批次"
          description="系统同一时间只允许存在一个当前轮次。批次编号、code 和展示轮次号都由系统自动递增生成，批次会按时间自动流转，管理员仅做补救和补执行。"
        />
        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
            {error}
          </div>
        ) : null}
        <form action={createBatchAction} className="mt-8 grid gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <SelectField
              name="questionnaireVersionId"
              label="已发布问卷版本"
              required
            >
              <option value="">请选择</option>
              {publishedQuestionnaires.map((option) => (
                <option key={option.id} value={option.id}>
                  V{option.versionNo} · {option.title}
                </option>
              ))}
            </SelectField>
            <TextArea
              name="notes"
              label="批次备注"
              hint="仅作为后台记录，不会展示给普通用户。"
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Field
              name="signupStartAt"
              label="开始报名时间"
              type="datetime-local"
              required
            />
            <Field
              name="signupEndAt"
              label="报名截止时间"
              type="datetime-local"
              required
            />
            <Field
              name="matchRunAt"
              label="匹配计算时间"
              type="datetime-local"
              required
            />
            <Field
              name="resultPublishAt"
              label="结果发布时间"
              type="datetime-local"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={publishedQuestionnaires.length === 0}
            >
              新建 draft 批次
            </Button>
          </div>
        </form>
      </SurfaceCard>

      {batches.length === 0 ? (
        <EmptyState
          title="还没有批次"
          description="先选择一个已发布问卷版本，再创建第一个 draft 批次。"
        />
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <SurfaceCard key={batch.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xl">
                    {batch.label} · {batch.code}
                  </p>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    状态 {batch.status}，问卷版本 {batch.questionnaireVersionId}
                    ，开始报名 {formatDateTime(batch.signupStartAt)}，报名截止{" "}
                    {formatDateTime(batch.signupEndAt)}，结果发布时间{" "}
                    {formatDateTime(batch.resultPublishAt)}。
                  </p>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    报名 {batch.participationCount} 人，已锁定{" "}
                    {batch.lockedCount} 人，已发布结果{" "}
                    {batch.publishedResultCount} 条，未匹配{" "}
                    {batch.unmatchedCount} 人。
                  </p>
                  {batch.lastErrorMessage ? (
                    <p className="mt-3 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
                      {batch.lastErrorMessage}
                    </p>
                  ) : null}
                </div>
                <ButtonLink href={`/admin/batches/${batch.id}`} tone="soft">
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
