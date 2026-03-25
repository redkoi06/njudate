import { Button, SectionHeader, SurfaceCard, TextArea } from "@/components/site-ui";
import { updateMatchScheduleTextAction } from "@/features/admin/configs/actions";
import { getMatchScheduleConfig } from "@/features/admin/configs/data";

export default async function AdminConfigsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [config, resolvedSearchParams] = await Promise.all([
    getMatchScheduleConfig(),
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
          eyebrow="平台配置"
          title="维护基础运营配置"
          description="当前后台只开放 match_schedule_text，其他旧配置项不再提供编辑入口。"
        />
        {error ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--status-warning)]/20 bg-[color:var(--status-warning-bg)] px-4 py-3 text-sm text-[color:var(--status-warning)]">
            {error}
          </div>
        ) : null}
        <form action={updateMatchScheduleTextAction} className="mt-8 grid gap-5">
          <TextArea
            name="value"
            label="match_schedule_text"
            hint={config.description}
            defaultValue={config.value}
          />
          <div className="flex justify-end">
            <Button type="submit">保存配置</Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
