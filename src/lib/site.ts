export const BRAND_NAME = "NJU DATE";
export const SCHOOL_EMAIL_DOMAIN = "smail.nju.edu.cn";
export const MATCH_SCHEDULE_TEXT = "每周三 20:00 统一公布结果";

export const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/about", label: "关于平台" },
  { href: "/privacy", label: "隐私说明" },
  { href: "/contact", label: "联系我们" },
] as const;

export const USER_NAV_ITEMS = [
  { href: "/app/dashboard", label: "首页" },
  { href: "/app/profile", label: "基本资料" },
  { href: "/app/questionnaire", label: "深度问卷" },
  { href: "/app/participation", label: "本周参与" },
  { href: "/app/matches", label: "匹配记录" },
  { href: "/app/settings", label: "设置" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "总览" },
  { href: "/admin/questionnaires", label: "问卷版本" },
  { href: "/admin/batches", label: "批次运营" },
  { href: "/admin/announcements", label: "公告后台" },
  { href: "/admin/configs", label: "平台配置" },
  { href: "/admin/users", label: "用户管理" },
] as const;

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateTimeInputFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "待定";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}

export function formatDateTimeInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return dateTimeInputFormatter.format(date).replace(" ", "T");
}

export function getQuestionnaireSubmissionStatusLabel(
  status: "not_started" | "draft" | "submitted" | "updated",
) {
  switch (status) {
    case "not_started":
      return "当前版本未开始";
    case "draft":
      return "当前版本草稿未提交";
    case "submitted":
      return "当前版本已提交";
    case "updated":
      return "当前版本已提交，另有未提交草稿";
  }
}

export function getQuestionnaireStatusLabel(input: {
  resultPublishAt?: string | null;
  signupEndAt?: string | null;
  status: "not_started" | "draft" | "submitted" | "updated";
  windowStatus: "open" | "closed";
}) {
  if (input.windowStatus === "closed") {
    return "当前轮问卷通道已关闭";
  }

  return getQuestionnaireSubmissionStatusLabel(input.status);
}

export function getQuestionnaireStatusHint(input: {
  resultPublishAt?: string | null;
  signupEndAt?: string | null;
  status: "not_started" | "draft" | "submitted" | "updated";
  windowStatus: "open" | "closed";
}) {
  if (input.windowStatus === "closed") {
    return `当前轮问卷通道已关闭。本轮报名截止于 ${formatDateTime(input.signupEndAt)}，结果公布时间为 ${formatDateTime(input.resultPublishAt)}。结果公布前仅支持查看，不允许保存或提交。`;
  }

  switch (input.status) {
    case "not_started":
      return "你还没有开始填写当前生效版本，请先完成正式提交。";
    case "draft":
      return "你已经保存了当前版本草稿，但还没有正式提交。";
    case "submitted":
      return "你已经正式提交当前版本，当前状态为已填写。";
    case "updated":
      return "你已经提交过当前版本，当前草稿尚未再次正式提交；系统仍以最近一次正式提交作为有效答案。";
  }
}

export function getQuestionnaireParticipationRequirement(input: {
  status: "not_started" | "draft" | "submitted" | "updated";
  windowStatus: "open" | "closed";
}) {
  if (input.windowStatus === "closed") {
    return "当前轮问卷通道已关闭，结果公布前不再开放新的提交或报名。";
  }

  switch (input.status) {
    case "not_started":
      return "当前版本未开始，请先正式提交当前问卷。";
    case "draft":
      return "当前版本草稿未提交，请先正式提交当前问卷。";
    case "submitted":
      return "当前版本已提交。";
    case "updated":
      return "当前版本已提交，另有未提交草稿。";
  }
}

export function getCurrentRoundStatusLabel(
  status: "not_joined" | "waiting_result" | "result_published",
) {
  switch (status) {
    case "not_joined":
      return "未参与";
    case "waiting_result":
      return "请等待公布结果";
    case "result_published":
      return "结果已公布";
  }
}

export function getParticipationStatusLabel(
  status: "not_joined" | "joined" | "locked" | "unavailable",
) {
  switch (status) {
    case "not_joined":
      return "未报名";
    case "joined":
      return "已报名";
    case "locked":
      return "已锁定";
    case "unavailable":
      return "暂不可报名";
  }
}

export function getMatchStatusLabel(
  status: "pending" | "matched" | "unmatched" | "error" | "expired" | null,
) {
  switch (status) {
    case "pending":
      return "待公布";
    case "matched":
      return "已匹配";
    case "unmatched":
      return "本轮未匹配";
    case "error":
      return "结果异常";
    case "expired":
      return "已过期";
    case null:
      return "暂无结果";
  }
}

export function getContactStatusLabel(
  status: "idle" | "confirming" | "triggered" | "failed" | "completed" | null,
) {
  switch (status) {
    case "idle":
      return "尚未发起";
    case "confirming":
      return "等待确认";
    case "triggered":
      return "已开放联系方式";
    case "failed":
      return "联系触发失败";
    case "completed":
      return "已完成";
    case null:
      return "尚未开放";
  }
}
