export function DeleteAccountPanel() {
  return (
    <div className="mt-5">
      <div className="border-border bg-background/70 rounded-2xl border p-5 shadow-[0_12px_24px_rgba(31,24,24,0.04)]">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg">账号删除</h3>
            <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
              请使用注册邮箱向 njudate_official@163.com 发送账号删除申请，我们将在收到申请后尽快处理。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
