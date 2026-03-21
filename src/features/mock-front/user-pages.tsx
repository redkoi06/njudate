"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  FileText,
  Heart,
  Info,
  LogOut,
  Mail,
  PencilLine,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";

import {
  CURRENT_BATCH_LABEL,
  CURRENT_BATCH_RANGE,
  DASHBOARD_ANNOUNCEMENTS,
  DEMO_NOW_LABEL,
  NEXT_MATCH_TIME_LABEL,
  QUESTION_SECTIONS,
  SIGNUP_DEADLINE_LABEL,
  USER_NAV_ITEMS,
  buildMatchRecords,
  buildNotifications,
  getAnsweredQuestionCount,
  getMatchRecordById,
  getMissingRequiredQuestions,
  getTotalRequiredQuestionCount,
} from "@/features/mock-front/data";
import { useDemoApp } from "@/features/mock-front/provider";
import {
  ActionButton,
  BrandLogo,
  EmptyState,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
  TextAreaField,
  TextField,
  TinyBadge,
  ToggleRow,
} from "@/features/mock-front/ui";
import type {
  MatchRecord,
  MockProfile,
  QuestionnaireAnswers,
} from "@/features/mock-front/types";

function getMatchTone(status: MatchRecord["status"]) {
  if (status === "contacted") return "success" as const;
  if (status === "waiting") return "info" as const;
  if (status === "no_match") return "neutral" as const;
  return "soft" as const;
}

function getMatchLabel(status: MatchRecord["status"]) {
  if (status === "contacted") return "已联系";
  if (status === "waiting") return "等待公布";
  if (status === "no_match") return "本轮未匹配";
  if (status === "archived") return "历史记录";
  return "已出结果";
}

export function UserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useDemoApp();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(240,230,232,0.85),transparent_26%),linear-gradient(180deg,#faf7f4_0%,#fffdfb_100%)]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col lg:flex-row">
        <aside className="border-border border-b bg-[color:var(--cream-warm)]/78 px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-r lg:border-b-0 lg:px-6 lg:py-6">
          <Link href="/" className="block">
            <BrandLogo subtitle="站内用户区" />
          </Link>

          <SurfaceCard className="mt-6 rounded-[24px] px-5 py-5 shadow-none">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full font-serif text-lg">
                {state.profile.nickname.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-foreground truncate text-sm">
                  {state.profile.nickname}
                </p>
                <p className="text-muted-foreground mt-1 truncate text-xs">
                  {state.profile.department} · {state.profile.grade}
                </p>
              </div>
            </div>
          </SurfaceCard>

          <nav className="mt-6 grid gap-1">
            {USER_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === "/app/matches" &&
                  pathname.startsWith("/app/matches"));
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
            {state.role === "admin" ? (
              <ActionButton tone="soft" onClick={() => router.push("/admin")}>
                <Shield size={15} />
                进入管理后台
              </ActionButton>
            ) : null}
            <ActionButton tone="soft" onClick={logout}>
              <LogOut size={15} />
              退出登录
            </ActionButton>
          </div>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { state } = useDemoApp();
  const router = useRouter();
  const records = buildMatchRecords(state);
  const notifications = buildNotifications(state);
  const latestRecord = records[0] ?? {
    id: "fallback",
    batchLabel: CURRENT_BATCH_LABEL,
    publishedAt: NEXT_MATCH_TIME_LABEL,
    status: "waiting" as const,
    preview: "",
    tags: [],
  };

  const primaryAction = !state.profileCompleted
    ? {
        title: "补齐基础资料",
        detail: "没有完整资料前，首页不会把你带入匹配报名流程。",
        actionLabel: "去完善资料",
        action: () => router.push("/app/profile"),
      }
    : state.questionnaireStatus !== "submitted"
      ? {
          title: "提交问卷以激活匹配资格",
          detail: "只有正式提交后的问卷版本才会计入本周匹配。",
          actionLabel: "继续填写问卷",
          action: () => router.push("/app/questionnaire"),
        }
      : state.weeklyParticipation === "not_joined"
        ? {
            title: "本周尚未报名",
            detail: `如果你愿意参加 ${CURRENT_BATCH_LABEL}，请在 ${SIGNUP_DEADLINE_LABEL} 前完成开关确认。`,
            actionLabel: "管理本周参与",
            action: () => router.push("/app/participation"),
          }
        : state.latestMatchStatus === "waiting"
          ? {
              title: "结果尚未公布",
              detail: `本轮结果会在 ${NEXT_MATCH_TIME_LABEL} 统一开放，不需要频繁刷新。`,
              actionLabel: "查看参与状态",
              action: () => router.push("/app/participation"),
            }
          : state.latestMatchStatus === "matched"
            ? {
                title:
                  state.contactStatus === "contacted"
                    ? "联系已触发"
                    : "最新匹配结果已出",
                detail:
                  state.contactStatus === "contacted"
                    ? "平台已向双方开放有限联系方式，你可以继续在边界内认识对方。"
                    : "你可以查看匹配理由、有限资料以及正式联系说明。",
                actionLabel: "查看匹配详情",
                action: () => router.push("/app/matches/latest"),
              }
            : {
                title: "本轮没有匹配结果",
                detail: "这不会影响你下周继续参与，问卷和资料仍会保留。",
                actionLabel: "查看匹配记录",
                action: () => router.push("/app/matches"),
              };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={DEMO_NOW_LABEL}
        title={`欢迎回来，${state.profile.nickname}`}
        description="这是第一阶段的完整 mock 前端：所有关键页面都可点击、可切换状态，但不连接任何数据库与后端。"
      />

      <SurfaceCard className="border-primary/15 relative overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(250,243,244,0.92))]">
        <div className="bg-primary/10 absolute top-0 right-0 size-40 rounded-full blur-3xl" />
        <p className="text-muted-foreground text-xs tracking-[0.18em]">
          下一步建议
        </p>
        <p className="text-foreground mt-4 text-2xl">{primaryAction.title}</p>
        <p className="text-secondary-foreground/80 mt-4 max-w-2xl text-sm leading-7">
          {primaryAction.detail}
        </p>
        <div className="mt-7">
          <ActionButton tone="wine" onClick={primaryAction.action}>
            {primaryAction.actionLabel}
            <ArrowRight size={16} />
          </ActionButton>
        </div>
      </SurfaceCard>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            资料状态
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {state.profileCompleted ? "已完善" : "待补齐"}
          </p>
          <div className="mt-4">
            <StatusBadge tone={state.profileCompleted ? "success" : "warning"}>
              {state.profileCompleted ? "可以继续下一步" : "尚不可报名"}
            </StatusBadge>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            问卷状态
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {state.questionnaireStatus === "submitted"
              ? "已生效"
              : state.questionnaireStatus === "draft"
                ? "草稿中"
                : "未开始"}
          </p>
          <div className="mt-4">
            <StatusBadge
              tone={
                state.questionnaireStatus === "submitted"
                  ? "success"
                  : "warning"
              }
            >
              {state.questionnaireStatus === "submitted"
                ? "当前版本可用于匹配"
                : "尚未正式提交"}
            </StatusBadge>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            本周参与
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {state.weeklyParticipation === "joined"
              ? "已报名"
              : state.weeklyParticipation === "locked"
                ? "已锁定"
                : "未报名"}
          </p>
          <p className="text-muted-foreground mt-4 text-xs leading-6">
            截止时间：{SIGNUP_DEADLINE_LABEL}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            最近结果
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {state.latestMatchStatus === "waiting"
              ? "等待公布"
              : state.latestMatchStatus === "matched"
                ? state.contactStatus === "contacted"
                  ? "已联系"
                  : "已匹配"
                : "未匹配"}
          </p>
          <div className="mt-4">
            <StatusBadge tone={getMatchTone(latestRecord.status)}>
              {getMatchLabel(latestRecord.status)}
            </StatusBadge>
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <p className="text-foreground text-lg">站内通知</p>
            <StatusBadge tone="soft">{notifications.length} 条</StatusBadge>
          </div>
          <div className="mt-6 space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="border-border bg-background/75 rounded-[24px] border px-5 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-foreground text-sm">{item.title}</p>
                  <StatusBadge tone={item.tone}>{item.timestamp}</StatusBadge>
                </div>
                <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-5">
          {DASHBOARD_ANNOUNCEMENTS.map((announcement) => (
            <SurfaceCard key={announcement.id}>
              <p className="text-muted-foreground text-xs tracking-[0.18em]">
                {announcement.eyebrow}
              </p>
              <p className="text-foreground mt-4 text-lg">
                {announcement.title}
              </p>
              <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                {announcement.detail}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-5 flex items-center justify-between">
          <p className="text-foreground text-lg">近期匹配</p>
          <ActionButton
            tone="soft"
            size="sm"
            onClick={() => router.push("/app/matches")}
          >
            查看全部
          </ActionButton>
        </div>
        <div className="space-y-4">
          {records.slice(0, 3).map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => router.push(`/app/matches/${record.id}`)}
              className="w-full text-left"
            >
              <SurfaceCard className="transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-foreground text-sm">
                        {record.batchLabel}
                      </p>
                      <StatusBadge tone={getMatchTone(record.status)}>
                        {getMatchLabel(record.status)}
                      </StatusBadge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {record.publishedAt}
                    </p>
                    <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                      {record.preview}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {record.score ? (
                      <>
                        <p className="text-primary font-serif text-3xl">
                          {record.score}%
                        </p>
                        <p className="text-muted-foreground text-xs">匹配度</p>
                      </>
                    ) : null}
                  </div>
                </div>
              </SurfaceCard>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { state, updateProfile } = useDemoApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => ({
    ...state.profile,
    interestsText: state.profile.interests.join("、"),
  }));

  const save = () => {
    updateProfile({
      nickname: form.nickname,
      department: form.department,
      major: form.major,
      grade: form.grade,
      gender: form.gender,
      targetPreference: form.targetPreference,
      bio: form.bio,
      interests: form.interestsText
        .split(/[、,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      showNickname: form.showNickname,
      publicFields: form.publicFields,
    } satisfies Partial<MockProfile>);
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="基本资料"
        title="把必要的信息写清楚"
        description="这里填写的是基础资料，不是深度问卷。被展示给对方的内容会严格受你的公开设置控制。"
        action={
          editing ? (
            <div className="flex gap-3">
              <ActionButton tone="soft" onClick={() => setEditing(false)}>
                取消
              </ActionButton>
              <ActionButton tone="wine" onClick={save}>
                保存资料
              </ActionButton>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {saved ? <StatusBadge tone="success">已保存</StatusBadge> : null}
              <ActionButton tone="soft" onClick={() => setEditing(true)}>
                <PencilLine size={15} />
                编辑
              </ActionButton>
            </div>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <SurfaceCard className="h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 text-primary flex size-22 items-center justify-center rounded-full font-serif text-3xl">
              {state.profile.nickname.slice(0, 1)}
            </div>
            <p className="text-foreground mt-5 text-xl">
              {state.profile.nickname}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {state.profile.email}
            </p>
            <div className="mt-4">
              <StatusBadge
                tone={state.profileCompleted ? "success" : "warning"}
              >
                {state.profileCompleted ? "资料已完善" : "资料尚未满足报名要求"}
              </StatusBadge>
            </div>
          </div>
          <div className="border-border bg-background/70 text-secondary-foreground/80 mt-8 rounded-[24px] border px-5 py-5 text-sm leading-7">
            真实邮箱不会对普通用户直接公开。平台只会在联系动作触发后按规则开放必要联系信息。
          </div>
        </SurfaceCard>

        <div className="space-y-5">
          <SurfaceCard>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="昵称"
                value={form.nickname}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nickname: event.target.value,
                  }))
                }
              />
              <TextField
                label="性别"
                value={form.gender}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
              />
              <TextField
                label="院系"
                value={form.department}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    department: event.target.value,
                  }))
                }
              />
              <TextField
                label="专业"
                value={form.major}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    major: event.target.value,
                  }))
                }
              />
              <TextField
                label="年级"
                value={form.grade}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    grade: event.target.value,
                  }))
                }
              />
              <TextField
                label="希望匹配的对象范围"
                value={form.targetPreference}
                disabled={!editing}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetPreference: event.target.value,
                  }))
                }
              />
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <TextAreaField
              label="简短自我介绍"
              rows={4}
              value={form.bio}
              disabled={!editing}
              onChange={(event) =>
                setForm((current) => ({ ...current, bio: event.target.value }))
              }
            />
          </SurfaceCard>

          <SurfaceCard>
            <TextField
              label="兴趣标签"
              value={form.interestsText}
              disabled={!editing}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  interestsText: event.target.value,
                }))
              }
              hint="使用顿号、逗号分隔，匹配详情会以标签形式展示。"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {form.interestsText
                .split(/[、,，]/)
                .map((item) => item.trim())
                .filter(Boolean)
                .map((item) => (
                  <TinyBadge key={item}>{item}</TinyBadge>
                ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-foreground text-lg">展示范围</p>
            <div className="border-border mt-4 space-y-2 border-t pt-3">
              <ToggleRow
                label="匹配时展示昵称"
                description="关闭后，平台会在结果页里仅展示匿名昵称。"
                checked={form.showNickname}
                onChange={() =>
                  editing
                    ? setForm((current) => ({
                        ...current,
                        showNickname: !current.showNickname,
                      }))
                    : undefined
                }
              />
              <ToggleRow
                label="展示院系"
                description="用于帮助对方建立基本判断，不展示完整专业班级细节。"
                checked={form.publicFields.department}
                onChange={() =>
                  editing
                    ? setForm((current) => ({
                        ...current,
                        publicFields: {
                          ...current.publicFields,
                          department: !current.publicFields.department,
                        },
                      }))
                    : undefined
                }
              />
              <ToggleRow
                label="展示年级"
                description="仅在匹配详情中展示，不进入公开区域。"
                checked={form.publicFields.grade}
                onChange={() =>
                  editing
                    ? setForm((current) => ({
                        ...current,
                        publicFields: {
                          ...current.publicFields,
                          grade: !current.publicFields.grade,
                        },
                      }))
                    : undefined
                }
              />
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}

export function QuestionnairePage() {
  const { state, saveQuestionnaireDraft, submitQuestionnaire } = useDemoApp();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(
    state.questionnaireStatus === "submitted",
  );
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(
    state.questionnaireAnswers,
  );

  const currentSection =
    QUESTION_SECTIONS[sectionIndex] ?? QUESTION_SECTIONS[0]!;
  const answeredCount = getAnsweredQuestionCount(answers);
  const requiredCount = getTotalRequiredQuestionCount();
  const progress = Math.round((answeredCount / requiredCount) * 100);

  const setAnswer = (id: string, value: QuestionnaireAnswers[string]) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setError("");
  };

  if (reviewMode) {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="深度问卷"
          title="当前已生效版本"
          description="提交完成后，当前版本会被用于后续匹配。你仍然可以继续修改，新的内容会在下一次正式提交后生效。"
          action={
            <div className="flex items-center gap-3">
              <StatusBadge tone="success">已生效</StatusBadge>
              <ActionButton tone="soft" onClick={() => setReviewMode(false)}>
                查看 / 修改
              </ActionButton>
            </div>
          }
        />

        {QUESTION_SECTIONS.map((section) => (
          <SurfaceCard key={section.id}>
            <p className="text-muted-foreground text-xs tracking-[0.18em]">
              {section.title}
            </p>
            <p className="text-foreground mt-3 text-xl">{section.subtitle}</p>
            <div className="mt-6 space-y-5">
              {section.questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-background/70 rounded-[24px] px-5 py-4"
                >
                  <p className="text-foreground text-sm">{question.prompt}</p>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {Array.isArray(answers[question.id])
                      ? (answers[question.id] as string[]).join("、")
                      : typeof answers[question.id] === "number"
                        ? `${answers[question.id]}/5`
                        : (answers[question.id] as string) || "未填写"}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="深度问卷"
        title="认真写下自己"
        description="问卷是平台最核心的输入。你可以先保存草稿，等确认后再正式提交。"
        action={
          <ActionButton
            tone="soft"
            onClick={() => saveQuestionnaireDraft(answers)}
          >
            保存草稿
          </ActionButton>
        }
      />

      <SurfaceCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-foreground text-sm">
              已完成 {answeredCount} / {requiredCount}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              当前状态：
              {state.questionnaireStatus === "submitted"
                ? "已生效"
                : state.questionnaireStatus === "draft"
                  ? "草稿"
                  : "未开始"}
            </p>
          </div>
          <StatusBadge tone="info">{progress}%</StatusBadge>
        </div>
        <div className="bg-border mt-5 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </SurfaceCard>

      <div className="bg-muted flex flex-wrap gap-2 rounded-[28px] p-2">
        {QUESTION_SECTIONS.map((section, index) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setSectionIndex(index)}
            className={
              sectionIndex === index
                ? "bg-card text-foreground rounded-full px-4 py-2 text-sm shadow-sm"
                : "text-muted-foreground rounded-full px-4 py-2 text-sm"
            }
          >
            {section.title}
          </button>
        ))}
      </div>

      <SurfaceCard>
        <p className="text-muted-foreground text-xs tracking-[0.18em]">
          {currentSection.title}
        </p>
        <p className="text-foreground mt-3 text-2xl">
          {currentSection.subtitle}
        </p>
        <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
          {currentSection.description}
        </p>

        <div className="mt-8 space-y-8">
          {currentSection.questions.map((question) => (
            <div
              key={question.id}
              className="border-border bg-background/75 rounded-[28px] border px-5 py-5"
            >
              <div className="flex items-start gap-3">
                <TinyBadge>{String(question.order).padStart(2, "0")}</TinyBadge>
                <div className="min-w-0">
                  <p className="text-foreground text-sm">{question.prompt}</p>
                  {question.helper ? (
                    <p className="text-muted-foreground mt-2 text-xs leading-6">
                      {question.helper}
                    </p>
                  ) : null}
                </div>
              </div>

              {question.kind === "text" ? (
                <TextAreaField
                  className="mt-5"
                  label="你的回答"
                  rows={4}
                  value={(answers[question.id] as string) || ""}
                  placeholder={question.placeholder}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                />
              ) : null}

              {question.kind === "single" ? (
                <div className="mt-5 grid gap-3">
                  {question.options?.map((option) => {
                    const selected = answers[question.id] === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAnswer(question.id, option)}
                        className={
                          selected
                            ? "border-primary/30 bg-primary/8 text-primary rounded-[24px] border px-5 py-4 text-left text-sm"
                            : "border-border bg-card text-secondary-foreground rounded-[24px] border px-5 py-4 text-left text-sm"
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {question.kind === "multiple" ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {question.options?.map((option) => {
                    const current = (answers[question.id] as string[]) || [];
                    const selected = current.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswer(
                            question.id,
                            selected
                              ? current.filter((item) => item !== option)
                              : [...current, option],
                          )
                        }
                        className={
                          selected
                            ? "border-primary/35 bg-primary/10 text-primary rounded-full border px-4 py-2 text-sm"
                            : "border-border bg-card text-secondary-foreground rounded-full border px-4 py-2 text-sm"
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {question.kind === "scale" ? (
                <div className="mt-5">
                  <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                    <span>{question.scaleLeftLabel}</span>
                    <span>{question.scaleRightLabel}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const selected = answers[question.id] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setAnswer(question.id, value)}
                          className={
                            selected
                              ? "border-primary/35 bg-primary/10 text-primary rounded-2xl border py-3 text-sm"
                              : "border-border bg-card text-secondary-foreground rounded-2xl border py-3 text-sm"
                          }
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SurfaceCard>

      {error ? (
        <SurfaceCard className="border-[color:rgba(192,64,64,0.2)] bg-[color:rgba(192,64,64,0.06)]">
          <p className="text-sm leading-7 text-[color:var(--destructive)]">
            {error}
          </p>
        </SurfaceCard>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ActionButton
          tone="soft"
          onClick={() => setSectionIndex((current) => Math.max(current - 1, 0))}
          disabled={sectionIndex === 0}
        >
          上一部分
        </ActionButton>
        <div className="flex gap-3">
          {sectionIndex < QUESTION_SECTIONS.length - 1 ? (
            <ActionButton
              tone="wine"
              onClick={() => setSectionIndex((current) => current + 1)}
            >
              下一部分
              <ArrowRight size={16} />
            </ActionButton>
          ) : (
            <ActionButton
              tone="wine"
              onClick={() => {
                const missing = getMissingRequiredQuestions(answers);
                if (missing.length > 0) {
                  setError(`仍有必答项未完成，请至少补齐：${missing[0]}`);
                  return;
                }
                submitQuestionnaire(answers);
                setReviewMode(true);
              }}
            >
              <CheckCircle2 size={16} />
              正式提交问卷
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParticipationPage() {
  const { state, setWeeklyParticipation } = useDemoApp();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const canParticipate =
    state.profileCompleted && state.questionnaireStatus === "submitted";

  const history = buildMatchRecords(state).slice(0, 3);

  if (!canParticipate) {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="本周参与"
          title="先补齐资料与问卷"
          description="需求文档要求：只有登录、资料完善、问卷生效且主动选择参加本周后，用户才进入匹配池。"
        />
        <SurfaceCard className="border-[color:rgba(160,122,58,0.2)] bg-[color:var(--status-warning-bg)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xl">
              <p className="text-foreground text-lg">当前还不能报名</p>
              <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                {state.profileCompleted
                  ? "问卷尚未正式提交。只有提交生效后的版本才会进入匹配流程。"
                  : "基础资料尚未完整。平台需要先确认你的基本信息和匹配偏好。"}
              </p>
            </div>
            <ActionButton
              tone="wine"
              onClick={() =>
                router.push(
                  state.profileCompleted
                    ? "/app/questionnaire"
                    : "/app/profile",
                )
              }
            >
              {state.profileCompleted ? "继续填写问卷" : "先完善资料"}
            </ActionButton>
          </div>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="本周参与"
        title={`${CURRENT_BATCH_LABEL} 的匹配开关`}
        description={`参与完全按周决定。当前批次为 ${CURRENT_BATCH_RANGE}，报名截止 ${SIGNUP_DEADLINE_LABEL}。`}
      />

      <SurfaceCard
        className={
          state.weeklyParticipation === "joined"
            ? "border-primary/20 bg-primary/5"
            : ""
        }
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-foreground text-2xl">
              {state.weeklyParticipation === "joined"
                ? "你已加入本周匹配"
                : "本周暂未加入"}
            </p>
            <p className="text-secondary-foreground/80 mt-4 max-w-2xl text-sm leading-7">
              {state.weeklyParticipation === "joined"
                ? `你的资料与当前问卷版本会参与 ${NEXT_MATCH_TIME_LABEL} 的统一匹配。`
                : "如果你这周不想参加，可以保持当前状态，下周再重新决定。"}
            </p>
          </div>
          <ActionButton tone="wine" onClick={() => setShowConfirm(true)}>
            {state.weeklyParticipation === "joined" ? "退出本周" : "加入本周"}
          </ActionButton>
        </div>
      </SurfaceCard>

      <div className="grid gap-5 md:grid-cols-2">
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            报名截止
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {SIGNUP_DEADLINE_LABEL}
          </p>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            截止后状态会锁定，本周不再允许修改报名开关。
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-muted-foreground text-xs tracking-[0.18em]">
            结果公布
          </p>
          <p className="text-foreground mt-4 text-2xl">
            {NEXT_MATCH_TIME_LABEL}
          </p>
          <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
            所有参与者统一开放结果，不制造实时刷新的焦虑体验。
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="bg-[color:var(--cream-warm)]/85">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-1 text-[color:var(--wine-medium)]" />
          <div className="text-secondary-foreground/80 space-y-2 text-sm leading-7">
            <p>参与是按周决定的，不是默认永久开启。</p>
            <p>
              如果你本周已经提交新问卷版本，系统会以当前生效版本为准参与匹配。
            </p>
            <p>
              联系动作一旦触发，平台会直接开放有限联系方式，不做轻量点赞式设计。
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div>
        <p className="text-foreground mb-4 text-lg">最近几轮记录</p>
        <div className="space-y-4">
          {history.map((record) => (
            <SurfaceCard key={record.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-foreground text-sm">{record.batchLabel}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {record.publishedAt}
                  </p>
                </div>
                <StatusBadge tone={getMatchTone(record.status)}>
                  {getMatchLabel(record.status)}
                </StatusBadge>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,26,26,0.42)] px-4">
          <SurfaceCard className="w-full max-w-md px-8 py-8">
            <p className="text-foreground text-2xl">
              {state.weeklyParticipation === "joined"
                ? "确认退出本周？"
                : "确认加入本周？"}
            </p>
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              {state.weeklyParticipation === "joined"
                ? "退出后，本周不会参与匹配。这不会影响你未来任意一周再次参加。"
                : "加入后，你会参与本轮统一匹配，直到报名截止前都可以再次修改。"}
            </p>
            <div className="mt-8 flex gap-3">
              <ActionButton tone="soft" onClick={() => setShowConfirm(false)}>
                取消
              </ActionButton>
              <ActionButton
                tone="wine"
                onClick={() => {
                  setWeeklyParticipation(
                    state.weeklyParticipation === "joined"
                      ? "not_joined"
                      : "joined",
                  );
                  setShowConfirm(false);
                }}
              >
                确认
              </ActionButton>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </div>
  );
}

export function MatchRecordsPage() {
  const router = useRouter();
  const records = buildMatchRecords(useDemoApp().state);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");
  const deferredKeyword = useDeferredValue(keyword);
  const filtered = records.filter((record) => {
    if (filter !== "all" && record.status !== filter) {
      return false;
    }

    if (!deferredKeyword.trim()) {
      return true;
    }

    const source = [
      record.batchLabel,
      record.counterpartName,
      record.counterpartDepartment,
      record.preview,
    ]
      .filter(Boolean)
      .join(" ");

    return source.includes(deferredKeyword.trim());
  });

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="匹配记录"
        title="所有历史结果"
        description="需求文档要求用户只能看到与自己相关的记录，这里保留了匹配成功、未匹配和等待结果三类状态。"
      />

      <div className="grid gap-5 md:grid-cols-3">
        <SurfaceCard className="text-center">
          <p className="text-foreground font-serif text-4xl">
            {records.length}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">总记录数</p>
        </SurfaceCard>
        <SurfaceCard className="text-center">
          <p className="text-foreground font-serif text-4xl">
            {
              records.filter(
                (record) =>
                  record.status === "matched" || record.status === "contacted",
              ).length
            }
          </p>
          <p className="text-muted-foreground mt-2 text-xs">有结果的轮次</p>
        </SurfaceCard>
        <SurfaceCard className="text-center">
          <p className="text-foreground font-serif text-4xl">
            {records.filter((record) => record.status === "contacted").length}
          </p>
          <p className="text-muted-foreground mt-2 text-xs">已联系</p>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <TextField
            label="搜索"
            placeholder="搜索周次、院系或简介片段"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <div>
            <p className="text-muted-foreground mb-2 text-xs tracking-[0.08em]">
              筛选
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "全部" },
                { value: "waiting", label: "等待中" },
                { value: "matched", label: "已出结果" },
                { value: "contacted", label: "已联系" },
                { value: "no_match", label: "未匹配" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={
                    filter === item.value
                      ? "bg-primary/10 text-primary rounded-full px-4 py-2 text-sm"
                      : "bg-muted text-muted-foreground rounded-full px-4 py-2 text-sm"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {filtered.length === 0 ? (
        <EmptyState
          title="没有符合条件的记录"
          description="可以清空筛选条件，或者先去查看本周参与与问卷状态。"
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => router.push(`/app/matches/${record.id}`)}
              className="w-full text-left"
            >
              <SurfaceCard className="transition hover:-translate-y-0.5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-foreground text-sm">
                        {record.batchLabel}
                      </p>
                      <StatusBadge tone={getMatchTone(record.status)}>
                        {getMatchLabel(record.status)}
                      </StatusBadge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {record.publishedAt}
                    </p>
                    <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
                      {record.preview}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {record.tags.map((tag) => (
                        <TinyBadge key={tag}>{tag}</TinyBadge>
                      ))}
                    </div>
                  </div>
                  {record.score ? (
                    <div className="shrink-0 text-right">
                      <p className="text-primary font-serif text-4xl">
                        {record.score}%
                      </p>
                      <p className="text-muted-foreground text-xs">匹配度</p>
                    </div>
                  ) : null}
                </div>
              </SurfaceCard>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchDetailPage({ matchId }: { matchId: string }) {
  const router = useRouter();
  const { state, setContactStatus } = useDemoApp();
  const record = getMatchRecordById(state, matchId);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!record) {
    return (
      <div className="space-y-6">
        <ActionButton tone="soft" onClick={() => router.push("/app/matches")}>
          <ArrowLeft size={15} />
          返回匹配记录
        </ActionButton>
        <EmptyState
          title="没有找到这条记录"
          description="它可能不存在，或者当前状态下没有这条 mock 数据。"
        />
      </div>
    );
  }

  if (record.status === "waiting") {
    return (
      <div className="space-y-6">
        <ActionButton tone="soft" onClick={() => router.push("/app/matches")}>
          <ArrowLeft size={15} />
          返回匹配记录
        </ActionButton>
        <EmptyState
          title="结果尚未开放"
          description={`本轮会在 ${NEXT_MATCH_TIME_LABEL} 统一公布。你已经完成参与，不需要反复刷新。`}
          action={
            <ActionButton
              tone="wine"
              onClick={() => router.push("/app/participation")}
            >
              查看本周参与状态
            </ActionButton>
          }
        />
      </div>
    );
  }

  if (record.status === "no_match") {
    return (
      <div className="space-y-6">
        <ActionButton tone="soft" onClick={() => router.push("/app/matches")}>
          <ArrowLeft size={15} />
          返回匹配记录
        </ActionButton>
        <EmptyState
          title="这一轮没有生成合适匹配"
          description="这只是当前批次没有找到合适结果，不代表你不适合使用平台。你可以保留现有资料，下周继续参加。"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ActionButton
                tone="soft"
                onClick={() => router.push("/app/profile")}
              >
                查看资料
              </ActionButton>
              <ActionButton
                tone="wine"
                onClick={() => router.push("/app/participation")}
              >
                回到参与页面
              </ActionButton>
            </div>
          }
        />
      </div>
    );
  }

  const contactReady =
    record.status !== "contacted" &&
    state.settings.privacy.allowDirectContact &&
    (record.id === "latest" ? state.contactStatus === "idle" : false);
  const showContactInfo =
    record.status === "contacted" ||
    (record.id === "latest" && state.contactStatus === "contacted");

  return (
    <div className="space-y-8">
      <ActionButton tone="soft" onClick={() => router.push("/app/matches")}>
        <ArrowLeft size={15} />
        返回匹配记录
      </ActionButton>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 text-primary flex size-22 items-center justify-center rounded-full font-serif text-3xl">
              {record.counterpartName?.slice(0, 1) ?? "?"}
            </div>
            <p className="text-foreground mt-5 text-2xl">
              {record.counterpartName}
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              {record.counterpartDepartment} · {record.counterpartGrade}
            </p>
            <p className="text-primary mt-6 font-serif text-5xl">
              {record.score}%
            </p>
            <p className="text-muted-foreground mt-2 text-xs">匹配度</p>
            <div className="mt-5">
              <StatusBadge tone={getMatchTone(record.status)}>
                {getMatchLabel(record.status)}
              </StatusBadge>
            </div>
          </div>

          <div className="border-border mt-8 border-t pt-6">
            {showContactInfo ? (
              <div className="rounded-[24px] border border-[color:rgba(90,138,110,0.2)] bg-[color:var(--status-success-bg)] px-5 py-5">
                <div className="flex items-center gap-2 text-[color:var(--status-success)]">
                  <Mail size={15} />
                  <p className="text-sm">联系方式已开放</p>
                </div>
                <p className="text-foreground mt-4 text-sm break-all">
                  {record.contactEmail}
                </p>
                <p className="text-secondary-foreground/80 mt-3 text-xs leading-6">
                  当前版本按需求文档执行：联系动作一旦触发，平台直接向双方开放有限联系方式。
                </p>
              </div>
            ) : contactReady ? (
              <ActionButton
                tone="wine"
                className="w-full"
                onClick={() => setShowConfirm(true)}
              >
                <Heart size={16} />
                联系 TA
              </ActionButton>
            ) : (
              <div className="border-border bg-muted text-muted-foreground rounded-[24px] border px-5 py-5 text-sm leading-7">
                {state.settings.privacy.allowDirectContact
                  ? "这条记录不支持再次触发联系。"
                  : "你已在设置中关闭直接联系能力，当前结果不再显示联系按钮。"}
              </div>
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-5">
          <SurfaceCard>
            <p className="text-muted-foreground text-xs tracking-[0.18em]">
              匹配理由
            </p>
            <div className="mt-5 space-y-4">
              {record.reasons?.map((reason, index) => (
                <div key={reason} className="flex gap-4">
                  <TinyBadge>{index + 1}</TinyBadge>
                  <p className="text-secondary-foreground/80 text-sm leading-7">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-muted-foreground text-xs tracking-[0.18em]">
              共鸣点
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {record.sharedSignals?.map((signal) => (
                <TinyBadge key={signal}>{signal}</TinyBadge>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <p className="text-muted-foreground text-xs tracking-[0.18em]">
              关于对方
            </p>
            <div className="mt-5 space-y-4">
              {record.highlights?.map((highlight) => (
                <div
                  key={highlight.label}
                  className="bg-background/75 rounded-[24px] px-5 py-4"
                >
                  <p className="text-muted-foreground text-xs">
                    {highlight.label}
                  </p>
                  <p className="text-secondary-foreground/80 mt-3 text-sm leading-7">
                    {highlight.value}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,26,26,0.42)] px-4">
          <SurfaceCard className="w-full max-w-lg px-8 py-8">
            <p className="text-foreground text-2xl">
              确认联系 {record.counterpartName}？
            </p>
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              确认后，平台会直接向双方开放有限联系方式，并同步记录“已联系”状态。这个动作默认不可撤回。
            </p>
            <div className="mt-8 flex gap-3">
              <ActionButton tone="soft" onClick={() => setShowConfirm(false)}>
                再想想
              </ActionButton>
              <ActionButton
                tone="wine"
                onClick={() => {
                  setContactStatus("contacted");
                  setShowConfirm(false);
                }}
              >
                确认联系
              </ActionButton>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </div>
  );
}

export function SettingsPage() {
  const { state, updateSettings, logout } = useDemoApp();
  const [saved, setSaved] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const touchSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="设置"
        title="通知、隐私与数据权利"
        description="这里把需求文档里的通知开关、删除申请、数据导出入口都先以前端形态完整做出来。"
        action={
          saved ? <StatusBadge tone="success">已保存</StatusBadge> : undefined
        }
      />

      <SurfaceCard>
        <div className="flex items-center gap-3">
          <UserRound size={16} className="text-primary" />
          <p className="text-foreground text-lg">账户信息</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="bg-background/75 rounded-[24px] px-5 py-4">
            <p className="text-muted-foreground text-xs">注册邮箱</p>
            <p className="text-foreground mt-3 text-sm">
              {state.profile.email}
            </p>
          </div>
          <div className="bg-background/75 rounded-[24px] px-5 py-4">
            <p className="text-muted-foreground text-xs">账户状态</p>
            <p className="text-foreground mt-3 text-sm">
              {state.settings.accountState === "active"
                ? "正常"
                : state.settings.accountState === "paused"
                  ? "已暂停"
                  : "已申请删除"}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center gap-3">
          <Bell size={16} className="text-primary" />
          <p className="text-foreground text-lg">通知设置</p>
        </div>
        <div className="divide-border mt-5 divide-y">
          <ToggleRow
            label="匹配结果通知"
            description="每周二结果公布时发送站内通知与邮件提示。"
            checked={state.settings.notifications.matchResult}
            onChange={() => {
              updateSettings(
                "notifications",
                "matchResult",
                !state.settings.notifications.matchResult,
              );
              touchSaved();
            }}
          />
          <ToggleRow
            label="联系触发通知"
            description="当你或对方触发正式联系时，发送关键提醒。"
            checked={state.settings.notifications.contactTrigger}
            onChange={() => {
              updateSettings(
                "notifications",
                "contactTrigger",
                !state.settings.notifications.contactTrigger,
              );
              touchSaved();
            }}
          />
          <ToggleRow
            label="每周参与提醒"
            description="周初提醒你本周是否要报名，属于可关闭提醒。"
            checked={state.settings.notifications.weeklyReminder}
            onChange={() => {
              updateSettings(
                "notifications",
                "weeklyReminder",
                !state.settings.notifications.weeklyReminder,
              );
              touchSaved();
            }}
          />
          <ToggleRow
            label="平台更新通知"
            description="版本更新、节假日安排与规则调整。"
            checked={state.settings.notifications.platformDigest}
            onChange={() => {
              updateSettings(
                "notifications",
                "platformDigest",
                !state.settings.notifications.platformDigest,
              );
              touchSaved();
            }}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center gap-3">
          <Shield size={16} className="text-primary" />
          <p className="text-foreground text-lg">隐私与联系</p>
        </div>
        <div className="divide-border mt-5 divide-y">
          <ToggleRow
            label="展示院系"
            description="仅在匹配详情中展示，不进入公开区域。"
            checked={state.settings.privacy.showDepartment}
            onChange={() => {
              updateSettings(
                "privacy",
                "showDepartment",
                !state.settings.privacy.showDepartment,
              );
              touchSaved();
            }}
          />
          <ToggleRow
            label="展示年级"
            description="用于帮助对方理解你的阶段与节奏。"
            checked={state.settings.privacy.showGrade}
            onChange={() => {
              updateSettings(
                "privacy",
                "showGrade",
                !state.settings.privacy.showGrade,
              );
              touchSaved();
            }}
          />
          <ToggleRow
            label="允许正式联系"
            description="关闭后，新的匹配结果不会提供直接联系按钮。"
            checked={state.settings.privacy.allowDirectContact}
            onChange={() => {
              updateSettings(
                "privacy",
                "allowDirectContact",
                !state.settings.privacy.allowDirectContact,
              );
              touchSaved();
            }}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-primary" />
          <p className="text-foreground text-lg">数据权利</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              updateSettings("exportRequested", "", true);
              touchSaved();
            }}
            className="border-border bg-background/75 rounded-[24px] border px-5 py-5 text-left transition hover:-translate-y-0.5"
          >
            <div className="text-foreground flex items-center gap-2 text-sm">
              <Download size={15} className="text-primary" />
              申请导出个人数据
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-6">
              当前为 mock 状态，但入口与权限说明已经保留。
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              updateSettings(
                "accountState",
                "",
                state.settings.accountState === "paused" ? "active" : "paused",
              );
              touchSaved();
            }}
            className="border-border bg-background/75 rounded-[24px] border px-5 py-5 text-left transition hover:-translate-y-0.5"
          >
            <div className="text-foreground flex items-center gap-2 text-sm">
              <Settings size={15} className="text-primary" />
              {state.settings.accountState === "paused"
                ? "恢复参与资格"
                : "暂停账户参与"}
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-6">
              暂停期间不会进入匹配池，但账户资料和历史记录会保留。
            </p>
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard className="border-[color:rgba(192,64,64,0.2)]">
        <div className="flex items-center gap-3 text-[color:var(--destructive)]">
          <AlertTriangle size={16} />
          <p className="text-lg">危险操作</p>
        </div>
        <p className="text-secondary-foreground/80 mt-4 max-w-2xl text-sm leading-7">
          删除申请会把账户状态改成“已申请删除”，后续真实接入阶段再补齐审核和真正删除链路。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionButton tone="soft" onClick={logout}>
            退出登录
          </ActionButton>
          <ActionButton tone="soft" onClick={() => setShowDelete(true)}>
            提交删除申请
          </ActionButton>
        </div>
      </SurfaceCard>

      {showDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,26,26,0.42)] px-4">
          <SurfaceCard className="w-full max-w-lg px-8 py-8">
            <p className="text-foreground text-2xl">确认删除申请？</p>
            <p className="text-secondary-foreground/80 mt-4 text-sm leading-7">
              为避免误触，请输入“确认删除”。当前阶段只会把账户切换成删除申请状态，不会真的清空数据。
            </p>
            <TextField
              className="mt-6"
              label="确认文字"
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
            />
            <div className="mt-8 flex gap-3">
              <ActionButton tone="soft" onClick={() => setShowDelete(false)}>
                取消
              </ActionButton>
              <ActionButton
                tone="wine"
                disabled={deleteText !== "确认删除"}
                onClick={() => {
                  updateSettings("accountState", "", "delete_requested");
                  touchSaved();
                  setShowDelete(false);
                  setDeleteText("");
                }}
              >
                提交申请
              </ActionButton>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </div>
  );
}
