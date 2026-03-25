import { Button, SectionHeader, SurfaceCard } from "@/components/site-ui";
import { saveSettingsAction } from "@/features/app/actions";
import { getSettings } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";

import { DeleteAccountPanel } from "./delete-account-panel";

function getSearchParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, resolvedSearchParams] = await Promise.all([
    requireAppUser(),
    searchParams,
  ]);
  const settings = await getSettings(user.id);
  const accountError = getSearchParamValue(resolvedSearchParams?.accountError);

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="设置"
          title="通知偏好与账号安全"
          description="关键通知仍会按平台规则保留，非关键提醒可以在这里调整。"
        />
        <form action={saveSettingsAction} className="mt-8 grid gap-4">
          <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
            匹配结果提醒
            <input
              type="checkbox"
              name="notifyMatchResult"
              defaultChecked={settings.notifyMatchResult}
            />
          </label>
          <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
            每周参与提醒
            <input
              type="checkbox"
              name="notifyWeeklyReminder"
              defaultChecked={settings.notifyWeeklyReminder}
            />
          </label>
          <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
            平台摘要提醒
            <input
              type="checkbox"
              name="notifyPlatformDigest"
              defaultChecked={settings.notifyPlatformDigest}
            />
          </label>
          <div className="flex justify-end">
            <Button type="submit">保存设置</Button>
          </div>
        </form>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">删除账号</h2>
        <DeleteAccountPanel
          {...(accountError ? { errorMessage: accountError } : {})}
        />
      </SurfaceCard>
    </div>
  );
}
