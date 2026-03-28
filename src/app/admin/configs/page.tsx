import {
  Button,
  FlashToast,
  SectionHeader,
  SurfaceCard,
  TextArea,
} from "@/components/site-ui";
import {
  updateMatchScheduleTextAction,
  updateRegistrationOpenAction,
} from "@/features/admin/configs/actions";
import {
  getMatchScheduleConfig,
  getRegistrationOpenConfig,
} from "@/features/admin/configs/data";

export default async function AdminConfigsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [config, registrationOpenConfig, resolvedSearchParams] = await Promise.all([
    getMatchScheduleConfig(),
    getRegistrationOpenConfig(),
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
          eyebrow="平台配置"
          title="维护基础运营配置"
          description="当前后台只开放 match_schedule_text 与 registration_open，其他旧配置项不再提供编辑入口。"
        />
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
        <form action={updateRegistrationOpenAction} className="mt-8 grid gap-5">
          <div className="border-border rounded-2xl border p-5">
            <p className="text-sm">registration_open</p>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              {registrationOpenConfig.description}
            </p>
            <label className="mt-5 inline-flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="registrationOpen"
                defaultChecked={registrationOpenConfig.value}
                className="accent-primary size-4"
              />
              <span>开放注册</span>
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit">保存注册开关</Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
