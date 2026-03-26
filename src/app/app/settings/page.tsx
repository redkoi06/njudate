import { SectionHeader, SurfaceCard } from "@/components/site-ui";
import { saveSettingsAction } from "@/features/app/actions";
import { getSettings } from "@/features/app/data";
import { requireAppUser } from "@/lib/auth/session";

import { DeleteAccountPanel } from "./delete-account-panel";
import { SettingsForm } from "./settings-form";

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
        <SettingsForm action={saveSettingsAction} defaultValues={settings} />
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
