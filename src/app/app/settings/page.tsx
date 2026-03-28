import { FlashToast, SectionHeader, SurfaceCard } from "@/components/site-ui";
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
      <FlashToast message={accountError} />
      <SurfaceCard>
        <SectionHeader
          eyebrow="设置"
          title="通知偏好与账号安全"
        />
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">通知偏好</h2>
        <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
          请选择是否接收以下邮件通知。
        </p>
        <SettingsForm action={saveSettingsAction} defaultValues={settings} />
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">账号安全</h2>
        <DeleteAccountPanel />
      </SurfaceCard>
    </div>
  );
}
