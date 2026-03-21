import { Button, SectionHeader, SurfaceCard, TextArea } from "@/components/site-ui";
import {
  createAccountRequestAction,
  saveSettingsAction,
} from "@/features/app/actions";
import { getSettings } from "@/features/app/data";
import { requireSessionUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const settings = await getSettings(user.id);

  return (
    <div className="grid gap-6">
      <SurfaceCard>
        <SectionHeader
          eyebrow="设置"
          title="通知偏好与账户申请"
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
        <h2 className="text-2xl">数据导出申请</h2>
        <form action={createAccountRequestAction} className="mt-5 grid gap-4">
          <input type="hidden" name="requestType" value="export_data" />
          <TextArea
            name="message"
            label="补充说明"
            hint="如果你希望导出特定范围的数据，可以在这里补充。"
          />
          <div className="flex justify-end">
            <Button tone="soft" type="submit">
              提交导出申请
            </Button>
          </div>
        </form>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-2xl">删除账号申请</h2>
        <form action={createAccountRequestAction} className="mt-5 grid gap-4">
          <input type="hidden" name="requestType" value="delete_account" />
          <TextArea
            name="message"
            label="补充说明"
            hint="请说明是否有需要平台提前处理或保留的事项。"
          />
          <div className="flex justify-end">
            <Button tone="soft" type="submit">
              提交删除申请
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
