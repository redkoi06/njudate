"use client";

import { useState } from "react";

import { Button, FieldErrorMessage } from "@/components/site-ui";
import { deleteOwnAccountAction } from "@/features/app/actions";

export function DeleteAccountPanel({
  errorMessage,
}: {
  errorMessage?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-5">
      <div className="border-border bg-background/70 rounded-2xl border p-5 shadow-[0_12px_24px_rgba(31,24,24,0.04)]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg">账号删除</h3>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              删除后会立即退出登录。
            </p>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              如果当前匹配轮次已经锁定或正在处理，系统会拒绝本次删除。请等待结果发布后再试。
            </p>
          </div>

          {errorMessage ? <FieldErrorMessage message={errorMessage} /> : null}

          {!confirming ? (
            <div className="flex justify-start md:justify-end">
              <Button
                type="button"
                tone="soft"
                className="w-full md:w-auto"
                onClick={() => setConfirming(true)}
              >
                删除账号
              </Button>
            </div>
          ) : (
            <div className="rounded-[28px] border border-[color:var(--status-warning)]/25 bg-[color:var(--status-warning-bg)]/60 p-5 shadow-[0_16px_30px_rgba(160,122,58,0.08)]">
              <p className="text-foreground text-base">确认删除账号？</p>
              <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                这是最后一次确认。确认后会立即执行软删除并退出当前会话，之后不能再用这个账号继续登录。
              </p>
              <form
                action={deleteOwnAccountAction}
                className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
              >
                <Button
                  type="button"
                  tone="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setConfirming(false)}
                >
                  取消
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  确认删除并退出登录
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
