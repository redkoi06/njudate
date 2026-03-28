import {
  Button,
  FlashToast,
  SectionHeader,
  SurfaceCard,
  TextArea,
} from "@/components/site-ui";
import { importQuestionnaireDefinitionAction } from "@/features/admin/questionnaires/actions";
import { getQuestionnairePublishingGate } from "@/features/admin/questionnaires/data";

export default async function AdminQuestionnaireImportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [gate, resolvedSearchParams] = await Promise.all([
    getQuestionnairePublishingGate(),
    searchParams,
  ]);

  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";

  return (
    <SurfaceCard>
      <FlashToast message={error} />
      <SectionHeader
        eyebrow="问卷导入"
        title="粘贴完整 JSON 生成新的 draft 版本"
        description="导入内容必须同时包含题目定义和 matchingPolicy。若系统内已存在 draft，本次导入会直接删除旧 draft 并重建。"
      />
      {!gate.canManage && gate.reason ? (
        <p className="text-secondary-foreground/80 mt-6 text-sm leading-7">
          当前不可导入：{gate.reason}
        </p>
      ) : null}
      <form
        action={importQuestionnaireDefinitionAction}
        className="mt-8 grid gap-5"
        noValidate
      >
        <TextArea
          name="definitionJson"
          label="问卷 JSON"
          hint="固定只支持后台粘贴 JSON 文本，不支持文件上传。"
          className="min-h-[420px] font-mono text-xs leading-6"
          disabled={!gate.canManage}
          required
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!gate.canManage}>
            生成 draft 版本
          </Button>
        </div>
      </form>
    </SurfaceCard>
  );
}
