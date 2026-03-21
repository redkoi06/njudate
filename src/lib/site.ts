export const BRAND_NAME = "NJU Date";
export const SCHOOL_EMAIL_DOMAIN = "smail.nju.edu.cn";
export const MATCH_SCHEDULE_TEXT = "每周二 20:30 统一公布结果";

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

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
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

export function getQuestionnaireStatusLabel(
  status: "not_started" | "draft" | "submitted" | "updated",
) {
  switch (status) {
    case "not_started":
      return "未开始";
    case "draft":
      return "草稿中";
    case "submitted":
      return "已提交";
    case "updated":
      return "有待提交更新";
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
