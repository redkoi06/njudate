import { notFound } from "next/navigation";

import {
  Button,
  ButtonLink,
  Field,
  SectionHeader,
  SelectField,
  SurfaceCard,
  TextArea,
} from "@/components/site-ui";
import {
  lockBatchAction,
  openBatchSignupAction,
  publishBatchNowAction,
  resetInterruptedBatchAction,
  runBatchNowAction,
  updateBatchAction,
} from "@/features/admin/batches/actions";
import {
  getBatchDetail,
  listPublishedQuestionnaireOptions,
} from "@/features/admin/batches/data";
import { formatDateTime, formatDateTimeInputValue } from "@/lib/site";

function BatchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-2xl border p-4">
      <p className="text-muted-foreground text-xs tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-lg">{value}</p>
    </div>
  );
}

export default async function AdminBatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const [batch, publishedQuestionnaires, resolvedSearchParams] =
    await Promise.all([
      getBatchDetail(resolvedParams.batchId),
      listPublishedQuestionnaireOptions(),
      searchParams,
    ]);

  if (!batch) {
    notFound();
  }

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow={`批次详情 · 第 ${batch.roundNo} 轮`}
          title={`${batch.label} · ${batch.code}`}
          description={`当前状态 ${batch.status}，问卷版本 ${
            batch.questionnaireVersionNo
              ? `V${batch.questionnaireVersionNo}`
              : batch.questionnaireVersionId
          }。系统会按时间自动推进，本页按钮仅用于补做或异常恢复。`}
          action={
            <ButtonLink href="/admin/batches" tone="ghost">
              返回列表
            </ButtonLink>
          }
        />
        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
            {error}
          </div>
        ) : null}
        {batch.lastErrorMessage ? (
          <p className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
            最近一次失败原因：{batch.lastErrorMessage}
          </p>
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BatchMetric
            label="报名人数"
            value={String(batch.participationCount)}
          />
          <BatchMetric label="已锁定人数" value={String(batch.lockedCount)} />
          <BatchMetric
            label="已发布结果"
            value={String(batch.publishedResultCount)}
          />
          <BatchMetric
            label="未匹配人数"
            value={String(batch.unmatchedCount)}
          />
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <h2 className="text-2xl">时间窗口</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <BatchMetric
              label="报名开始"
              value={formatDateTime(batch.signupStartAt)}
            />
            <BatchMetric
              label="报名截止"
              value={formatDateTime(batch.signupEndAt)}
            />
            <BatchMetric
              label="计算时间"
              value={formatDateTime(batch.matchRunAt)}
            />
          </div>
          <div className="mt-4">
            <BatchMetric
              label="结果发布时间"
              value={formatDateTime(batch.resultPublishAt)}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-2xl">Policy Snapshot 摘要</h2>
          <div className="mt-5 grid gap-3">
            {batch.matchingPolicySummary.map((item) => (
              <div
                key={item}
                className="border-border rounded-2xl border p-4 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h2 className="text-2xl">批次编辑</h2>
        {batch.status === "draft" ? (
          <>
            <form action={updateBatchAction} className="mt-6 grid gap-5">
              <input type="hidden" name="batchId" value={batch.id} />
              <div className="grid gap-5 lg:grid-cols-2">
                <SelectField
                  name="questionnaireVersionId"
                  label="已发布问卷版本"
                  defaultValue={batch.questionnaireVersionId}
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
                  defaultValue={batch.notes ?? ""}
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field
                  name="signupStartAt"
                  label="开始报名时间"
                  type="datetime-local"
                  defaultValue={formatDateTimeInputValue(batch.signupStartAt)}
                  required
                />
                <Field
                  name="signupEndAt"
                  label="报名截止时间"
                  type="datetime-local"
                  defaultValue={formatDateTimeInputValue(batch.signupEndAt)}
                  required
                />
                <Field
                  name="matchRunAt"
                  label="匹配计算时间"
                  type="datetime-local"
                  defaultValue={formatDateTimeInputValue(batch.matchRunAt)}
                  required
                />
                <Field
                  name="resultPublishAt"
                  label="结果发布时间"
                  type="datetime-local"
                  defaultValue={formatDateTimeInputValue(batch.resultPublishAt)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" tone="soft">
                  保存 draft
                </Button>
              </div>
            </form>
            <div className="mt-4 flex justify-end">
              <form action={openBatchSignupAction}>
                <input type="hidden" name="batchId" value={batch.id} />
                <Button type="submit">打开报名</Button>
              </form>
            </div>
          </>
        ) : (
          <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
            只有 draft
            批次允许编辑问卷版本和时间窗口。当前批次需要通过下方动作继续推进。
          </p>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">批次动作</h2>
        <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
          系统会按时间自动开放报名、锁定、执行匹配和公布结果。下列按钮只用于补做已经到时的动作，不能提前抢跑时间线。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {batch.status === "open" ? (
            <form action={lockBatchAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit">关闭报名并锁定</Button>
            </form>
          ) : null}
          {batch.status === "locked" || batch.status === "failed" ? (
            <form action={runBatchNowAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit">
                {batch.status === "failed" ? "失败后重跑" : "立即执行匹配"}
              </Button>
            </form>
          ) : null}
          {batch.status === "processing" && batch.processedAt ? (
            <form action={publishBatchNowAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit">立即公布结果</Button>
            </form>
          ) : null}
          {batch.status === "processing" && !batch.processedAt ? (
            <form action={resetInterruptedBatchAction}>
              <input type="hidden" name="batchId" value={batch.id} />
              <Button type="submit" tone="soft">
                重置为失败后重跑
              </Button>
            </form>
          ) : null}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">最近操作日志</h2>
        <div className="mt-5 grid gap-3">
          {batch.operationLogs.length > 0 ? (
            batch.operationLogs.map((log) => (
              <div
                key={log.id}
                className="border-border rounded-2xl border p-4"
              >
                <p className="text-sm">{log.actionType}</p>
                <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                  {log.actorRole} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-secondary-foreground/80 text-sm leading-7">
              还没有操作日志。
            </p>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
