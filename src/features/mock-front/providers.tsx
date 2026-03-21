"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelsTopLeft, X } from "lucide-react";

import { DemoAppProvider, useDemoApp } from "@/features/mock-front/provider";
import { ActionButton, SurfaceCard, TinyBadge } from "@/features/mock-front/ui";
import type { DemoPresetId } from "@/features/mock-front/types";

const PRESETS: Array<{ id: DemoPresetId; label: string }> = [
  { id: "visitor", label: "游客" },
  { id: "new_user", label: "新用户" },
  { id: "draft_questionnaire", label: "问卷草稿" },
  { id: "ready_to_join", label: "已完成未报名" },
  { id: "waiting_result", label: "等待结果" },
  { id: "matched", label: "已匹配未联系" },
  { id: "contacted", label: "已匹配已联系" },
  { id: "no_match", label: "本轮未匹配" },
  { id: "admin_full", label: "后台有数据" },
  { id: "admin_empty", label: "后台空状态" },
];

function DemoDock() {
  const pathname = usePathname();
  const { state, applyPreset } = useDemoApp();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-5 bottom-5 z-[80] max-w-[calc(100vw-2.5rem)]">
      {open ? (
        <SurfaceCard className="w-[360px] rounded-[28px] px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground text-sm">演示状态</p>
              <p className="text-muted-foreground mt-1 text-xs">{pathname}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)}>
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <TinyBadge>角色：{state.role}</TinyBadge>
            <TinyBadge>问卷：{state.questionnaireStatus}</TinyBadge>
            <TinyBadge>本周：{state.weeklyParticipation}</TinyBadge>
            <TinyBadge>结果：{state.latestMatchStatus}</TinyBadge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="border-border bg-background text-secondary-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground rounded-2xl border px-3 py-3 text-left text-xs transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </SurfaceCard>
      ) : (
        <ActionButton tone="wine" onClick={() => setOpen(true)}>
          <PanelsTopLeft size={16} />
          演示状态
        </ActionButton>
      )}
    </div>
  );
}

export function MockFrontProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoAppProvider>
      {children}
      <DemoDock />
    </DemoAppProvider>
  );
}
