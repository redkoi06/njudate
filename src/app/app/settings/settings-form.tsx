"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/site-ui";

function SubmitButton({ hasChanges }: { hasChanges: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || !hasChanges}
      className="disabled:cursor-default"
    >
      保存设置
    </Button>
  );
}

export function SettingsForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValues: {
    notifyMatchResult: boolean;
    notifyWeeklyReminder: boolean;
    notifyPlatformDigest: boolean;
  };
}) {
  const [notifyMatchResult, setNotifyMatchResult] = useState(
    defaultValues.notifyMatchResult,
  );
  const [notifyWeeklyReminder, setNotifyWeeklyReminder] = useState(
    defaultValues.notifyWeeklyReminder,
  );
  const [notifyPlatformDigest, setNotifyPlatformDigest] = useState(
    defaultValues.notifyPlatformDigest,
  );
  const hasChanges =
    notifyMatchResult !== defaultValues.notifyMatchResult ||
    notifyWeeklyReminder !== defaultValues.notifyWeeklyReminder ||
    notifyPlatformDigest !== defaultValues.notifyPlatformDigest;

  return (
    <form action={action} className="mt-8 grid gap-4">
      <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
        匹配结果提醒
        <input
          type="checkbox"
          name="notifyMatchResult"
          checked={notifyMatchResult}
          onChange={(event) => setNotifyMatchResult(event.target.checked)}
        />
      </label>
      <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
        每周参与提醒
        <input
          type="checkbox"
          name="notifyWeeklyReminder"
          checked={notifyWeeklyReminder}
          onChange={(event) => setNotifyWeeklyReminder(event.target.checked)}
        />
      </label>
      <label className="border-border flex items-center justify-between rounded-2xl border px-4 py-4 text-sm">
        平台摘要提醒
        <input
          type="checkbox"
          name="notifyPlatformDigest"
          checked={notifyPlatformDigest}
          onChange={(event) => setNotifyPlatformDigest(event.target.checked)}
        />
      </label>
      <div className="flex justify-end">
        <SubmitButton hasChanges={hasChanges} />
      </div>
    </form>
  );
}
