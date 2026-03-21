"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  Eye,
  LogOut,
  MessageSquareMore,
  Play,
  Send,
  X,
} from "lucide-react";

import {
  ADMIN_NAV_ITEMS,
  CURRENT_BATCH_LABEL,
  CURRENT_BATCH_RANGE,
  NEXT_MATCH_TIME_LABEL,
  SIGNUP_DEADLINE_LABEL,
  buildAdminOverview,
  buildAdminUsers,
  buildConsultations,
  buildMatchBatches,
  QUESTION_BANK_ITEMS,
} from "@/features/mock-front/data";
import { useDemoApp } from "@/features/mock-front/provider";
import {
  ActionButton,
  BrandLogo,
  EmptyState,
  SectionHeader,
  SimpleBarChart,
  SimpleLineChart,
  StatusBadge,
  SurfaceCard,
  TextAreaField,
  TextField,
  TinyBadge,
} from "@/features/mock-front/ui";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useDemoApp();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(240,230,232,0.75),transparent_26%),linear-gradient(180deg,#faf7f4_0%,#fffdfb_100%)]">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col lg:flex-row">
        <aside className="border-border border-b bg-[color:var(--cream-warm)]/78 px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-r lg:border-b-0 lg:px-6 lg:py-6">
          <Link href="/" className="block">
            <BrandLogo subtitle="管理后台" />
          </Link>

          <SurfaceCard className="mt-6 rounded-[24px] px-5 py-5 shadow-none">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full font-serif text-lg">
                管
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm">
                  {state.profile.nickname}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  当前为演示管理员视角
                </p>
              </div>
            </div>
          </SurfaceCard>

          <nav className="mt-6 grid gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "bg-primary/10 text-primary rounded-2xl px-4 py-3 text-sm"
                      : "text-secondary-foreground hover:bg-card/70 hover:text-foreground rounded-2xl px-4 py-3 text-sm transition"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 grid gap-3">
            <ActionButton
              tone="soft"
              onClick={() => router.push("/app/dashboard")}
            >
              <ArrowLeft size={15} />
              返回用户区
            </ActionButton>
            <ActionButton tone="soft" onClick={logout}>
              <LogOut size={15} />
              退出登录
            </ActionButton>
          </div>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminOverviewPage() {
  const { state } = useDemoApp();
  const overview = buildAdminOverview(state.adminDataMode);
  const users = buildAdminUsers(state.adminDataMode);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="管理后台"
        title="平台运行概览"
        description="这里覆盖了需求文档里的核心指标、趋势和近期用户数据，并提供后台空状态切换。"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {overview.stats.map((stat) => (
          <SurfaceCard key={stat.label}>
            <p className="text-muted-foreground text-xs tracking-[0.18em]">
              {stat.label}
            </p>
            <p className="text-foreground mt-4 font-serif text-5xl">
              {stat.value}
            </p>
            <p className="text-muted-foreground mt-3 text-xs">
              {stat.sublabel}
            </p>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard>
          <p className="text-foreground text-lg">近几轮参与与联系</p>
          <div className="mt-6">
            <SimpleBarChart
              values={overview.weeklySeries.flatMap((item) => [
                item.participants,
                item.pairs,
                item.contacts,
              ])}
              colors={[
                "var(--wine-light)",
                "var(--primary)",
                "var(--wine-medium)",
              ]}
            />
          </div>
          <div className="text-muted-foreground mt-4 grid grid-cols-4 gap-3 text-center text-xs">
            {overview.weeklySeries.map((item) => (
              <p key={item.label}>{item.label}</p>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <p className="text-foreground text-lg">注册趋势</p>
          <div className="mt-6">
            <SimpleLineChart values={overview.registrationSeries} />
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="flex items-center justify-between">
          <p className="text-foreground text-lg">最近用户</p>
          <StatusBadge tone="soft">
            {state.adminDataMode === "empty" ? "空状态" : "有数据"}
          </StatusBadge>
        </div>
        {users.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="还没有可展示的用户数据"
              description="切到“后台有数据”后，这里会出现注册、问卷完成和本周参与的 mock 列表。"
            />
          </div>
        ) : (
          <div className="border-border mt-6 overflow-hidden rounded-[28px] border">
            <div className="text-muted-foreground grid grid-cols-[1.3fr_1fr_0.8fr_0.7fr] bg-[color:var(--cream-warm)] px-5 py-3 text-xs">
              <p>用户</p>
              <p>院系 / 年级</p>
              <p>注册时间</p>
              <p>状态</p>
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="border-border grid grid-cols-[1.3fr_1fr_0.8fr_0.7fr] items-center border-t px-5 py-4 text-sm"
              >
                <div>
                  <p className="text-foreground">{user.nickname}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {user.emailMask}
                  </p>
                </div>
                <p className="text-secondary-foreground">
                  {user.department} · {user.grade}
                </p>
                <p className="text-muted-foreground">{user.joinedAt}</p>
                <StatusBadge
                  tone={
                    user.status === "active"
                      ? "success"
                      : user.status === "paused"
                        ? "neutral"
                        : "warning"
                  }
                >
                  {user.status === "active"
                    ? "正常"
                    : user.status === "paused"
                      ? "暂停"
                      : "受限"}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

export function AdminUsersPage() {
  const { state } = useDemoApp();
  const users = buildAdminUsers(state.adminDataMode);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deferredKeyword = useDeferredValue(keyword);
  const selectedUser = users.find((user) => user.id === selectedId) ?? null;
  const filtered = users.filter((user) => {
    if (!deferredKeyword.trim()) {
      return true;
    }

    return [user.nickname, user.department, user.emailMask]
      .join(" ")
      .includes(deferredKeyword.trim());
  });

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="管理后台"
        title="用户管理"
        description="后台默认遵循最小必要原则，不展示原始问卷全文，只保留运营判断所需状态。"
      />

      <SurfaceCard>
        <TextField
          label="搜索用户"
          placeholder="按昵称、院系或邮箱片段搜索"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyState
          title="当前没有用户数据"
          description="切换到“后台有数据”后，可以查看用户状态、问卷完成度和参与概况。"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((user) => (
            <SurfaceCard key={user.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-foreground text-sm">{user.nickname}</p>
                    <TinyBadge>{user.emailMask}</TinyBadge>
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {user.department} · {user.grade} · 已参与{" "}
                    {user.participationCount} 次
                  </p>
                </div>
                <div className="flex gap-3">
                  <StatusBadge
                    tone={user.questionnaireComplete ? "success" : "warning"}
                  >
                    {user.questionnaireComplete ? "问卷完成" : "问卷未完成"}
                  </StatusBadge>
                  <ActionButton
                    tone="soft"
                    onClick={() => setSelectedId(user.id)}
                  >
                    <Eye size={15} />
                    查看详情
                  </ActionButton>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(28,26,26,0.36)]">
          <div className="border-border bg-background h-full w-full max-w-lg overflow-y-auto border-l px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground text-2xl">用户详情</p>
              <button type="button" onClick={() => setSelectedId(null)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="mt-8 space-y-4">
              {[
                ["昵称", selectedUser.nickname],
                ["邮箱掩码", selectedUser.emailMask],
                [
                  "院系 / 年级",
                  `${selectedUser.department} · ${selectedUser.grade}`,
                ],
                ["注册时间", selectedUser.joinedAt],
                [
                  "本周参与",
                  selectedUser.participatedThisWeek ? "已报名" : "未报名",
                ],
                [
                  "问卷状态",
                  selectedUser.questionnaireComplete ? "已完成" : "未完成",
                ],
              ].map(([label, value]) => (
                <SurfaceCard key={label} className="rounded-[24px] px-5 py-4">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-foreground mt-2 text-sm">{value}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function QuestionBankPage() {
  const { state } = useDemoApp();
  const questions = state.adminDataMode === "empty" ? [] : QUESTION_BANK_ITEMS;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = questions.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="管理后台"
        title="题库管理"
        description="这里先把题目列表、草稿状态和编辑抽屉做成完整前端，后续再接真实题库。"
        action={<ActionButton tone="wine">新增题目</ActionButton>}
      />

      {questions.length === 0 ? (
        <EmptyState
          title="题库当前为空"
          description="切换到“后台有数据”后，这里会出现问卷章节、题目状态和编辑入口。"
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <SurfaceCard key={question.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <TinyBadge>{question.sectionId}</TinyBadge>
                    <StatusBadge
                      tone={
                        question.state === "published" ? "success" : "warning"
                      }
                    >
                      {question.state === "published" ? "已发布" : "草稿"}
                    </StatusBadge>
                  </div>
                  <p className="text-secondary-foreground/85 mt-4 text-sm leading-7">
                    {question.prompt}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TinyBadge>{question.responseCount} 份回答</TinyBadge>
                  <ActionButton
                    tone="soft"
                    onClick={() => setSelectedId(question.id)}
                  >
                    <BookOpenText size={15} />
                    编辑
                  </ActionButton>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(28,26,26,0.36)]">
          <div className="border-border bg-background h-full w-full max-w-xl overflow-y-auto border-l px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground text-2xl">编辑题目</p>
              <button type="button" onClick={() => setSelectedId(null)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="mt-8 space-y-5">
              <TextField label="章节" value={selected.sectionId} readOnly />
              <TextField label="题型" value={selected.type} readOnly />
              <TextAreaField
                label="题目内容"
                rows={5}
                defaultValue={selected.prompt}
              />
              <ActionButton tone="wine">保存题目</ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MatchBatchesPage() {
  const { state } = useDemoApp();
  const batches = buildMatchBatches(state.adminDataMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const selected = batches.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="管理后台"
        title="匹配批次"
        description="这一页覆盖了当前批次、历史批次、手动运行和详情抽屉，满足第一阶段的完整前端要求。"
      />

      <SurfaceCard className="border-primary/15 bg-primary/5">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-foreground text-sm">{CURRENT_BATCH_LABEL}</p>
            <p className="text-foreground mt-3 text-2xl">
              {CURRENT_BATCH_RANGE}
            </p>
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              报名截止 {SIGNUP_DEADLINE_LABEL}，统一公布时间{" "}
              {NEXT_MATCH_TIME_LABEL}。
            </p>
          </div>
          <ActionButton
            tone="wine"
            onClick={async () => {
              setRunning(true);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              setRunning(false);
            }}
          >
            <Play size={15} />
            {running ? "运行中…" : "运行本轮匹配"}
          </ActionButton>
        </div>
      </SurfaceCard>

      {batches.length === 0 ? (
        <EmptyState
          title="当前没有批次数据"
          description="切换到“后台有数据”后，这里会显示报名人数、匹配对数和联系触发数。"
        />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <SurfaceCard key={batch.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-foreground text-sm">{batch.label}</p>
                    <StatusBadge
                      tone={
                        batch.status === "completed"
                          ? "success"
                          : batch.status === "processing"
                            ? "warning"
                            : "info"
                      }
                    >
                      {batch.status === "completed"
                        ? "已完成"
                        : batch.status === "processing"
                          ? "处理中"
                          : "报名中"}
                    </StatusBadge>
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {batch.dateRange} · 报名 {batch.participants} 人 · 匹配{" "}
                    {batch.matchedPairs ?? "—"} 对
                  </p>
                </div>
                <ActionButton
                  tone="soft"
                  onClick={() => setSelectedId(batch.id)}
                >
                  <Eye size={15} />
                  查看详情
                </ActionButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(28,26,26,0.36)]">
          <div className="border-border bg-background h-full w-full max-w-xl overflow-y-auto border-l px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground text-2xl">批次详情</p>
              <button type="button" onClick={() => setSelectedId(null)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="mt-8 space-y-4">
              {[
                ["批次", selected.label],
                ["时间范围", selected.dateRange],
                ["报名截止", selected.signupDeadline],
                ["公布时间", selected.publishTime],
                ["参与人数", `${selected.participants}`],
                ["匹配对数", selected.matchedPairs?.toString() ?? "—"],
                ["未匹配人数", selected.unmatchedUsers?.toString() ?? "—"],
                ["联系触发数", selected.contactTriggers?.toString() ?? "—"],
              ].map(([label, value]) => (
                <SurfaceCard key={label} className="rounded-[24px] px-5 py-4">
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-foreground mt-2 text-sm">{value}</p>
                </SurfaceCard>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ContactConsultPage() {
  const { state } = useDemoApp();
  const consultations = buildConsultations(state.adminDataMode);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const selected = consultations.find((item) => item.id === selectedId) ?? null;
  const filtered = consultations.filter((item) =>
    [item.topic, item.sender, item.message]
      .join(" ")
      .includes(deferredKeyword.trim()),
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="管理后台"
        title="联系咨询"
        description="这里保留咨询列表、回复框、已解决状态和紧急反馈标记。"
      />

      <SurfaceCard>
        <TextField
          label="搜索留言"
          placeholder="按主题、邮箱片段或内容搜索"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </SurfaceCard>

      {consultations.length === 0 ? (
        <EmptyState
          title="当前没有咨询数据"
          description="切换到“后台有数据”后，可以查看咨询列表、回复状态和紧急反馈。"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <SurfaceCard key={item.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-foreground text-sm">{item.topic}</p>
                    <StatusBadge
                      tone={
                        item.status === "resolved"
                          ? "success"
                          : item.status === "replied"
                            ? "info"
                            : "warning"
                      }
                    >
                      {item.status === "resolved"
                        ? "已解决"
                        : item.status === "replied"
                          ? "已回复"
                          : "待回复"}
                    </StatusBadge>
                    {item.priority === "urgent" ? (
                      <TinyBadge className="bg-[color:rgba(192,64,64,0.08)] text-[color:var(--destructive)]">
                        紧急
                      </TinyBadge>
                    ) : null}
                  </div>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {item.message}
                  </p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    {item.sender} · {item.createdAt}
                  </p>
                </div>
                <ActionButton
                  tone="soft"
                  onClick={() => setSelectedId(item.id)}
                >
                  <MessageSquareMore size={15} />
                  处理
                </ActionButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(28,26,26,0.36)]">
          <div className="border-border bg-background h-full w-full max-w-xl overflow-y-auto border-l px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground text-2xl">处理咨询</p>
              <button type="button" onClick={() => setSelectedId(null)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <SurfaceCard className="mt-8">
              <p className="text-foreground text-sm">{selected.topic}</p>
              <p className="text-muted-foreground mt-3 text-xs">
                {selected.sender} · {selected.createdAt}
              </p>
              <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                {selected.message}
              </p>
            </SurfaceCard>
            {selected.reply ? (
              <SurfaceCard className="mt-5 border-[color:rgba(90,138,110,0.2)] bg-[color:var(--status-success-bg)]">
                <p className="text-sm text-[color:var(--status-success)]">
                  历史回复
                </p>
                <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                  {selected.reply}
                </p>
              </SurfaceCard>
            ) : null}
            <div className="mt-5">
              <TextAreaField
                label="回复内容"
                rows={6}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <ActionButton tone="soft" onClick={() => setSelectedId(null)}>
                关闭
              </ActionButton>
              <ActionButton tone="wine">
                <Send size={15} />
                发送回复
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
