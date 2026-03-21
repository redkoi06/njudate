export type HomeFeature = {
  title: string;
  description: string;
};

export type HomeCommitment = {
  title: string;
  description: string;
};

export type HomeFaqItem = {
  question: string;
  answer: string;
};

export type BuildHomeStepsInput = {
  currentBatchLabel: string | null;
  signupDeadlineLabel: string;
  nextMatchTimeLabel: string;
};

export const HOME_PLACEHOLDER_PHOTO = "/images/photos/photo_1.jpg";

export const HOME_FEATURES: HomeFeature[] = [
  {
    title: "问卷优先，不刷人",
    description:
      "平台先理解你是谁，再决定是否生成匹配，不让注意力消耗在无尽曝光里。",
  },
  {
    title: "固定节奏，减少焦虑",
    description:
      "是否参加由你按周决定，结果统一揭晓，不需要反复刷新，也不会被持续在线压力裹挟。",
  },
  {
    title: "边界清晰，值得信任",
    description:
      "不公开浏览，不开放搜索，联系方式只在正式联系动作后按规则开放。",
  },
  {
    title: "结果可读，不是黑箱",
    description:
      "不是只告诉你“有没有”，还会说明为什么会是这个人，帮助你判断值不值得继续。",
  },
];

export const HOME_COMMITMENTS: HomeCommitment[] = [
  {
    title: "只对校内开放",
    description: "使用学校邮箱进入，平台边界始终限定在校园场景内。",
  },
  {
    title: "每周统一揭晓",
    description: "配对不是即时反馈，而是固定节奏的郑重决定。",
  },
  {
    title: "联系动作有后果",
    description: "当你点击联系，平台才会按规则开放有限联系方式。",
  },
];

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "谁可以使用 NJU Date？",
    answer: "当前版本仅对校内邮箱用户开放，外部邮箱无法进入站内流程。",
  },
  {
    question: "为什么不能公开浏览别人？",
    answer:
      "因为这个产品解决的是认真相遇，而不是公共广场。我们刻意降低曝光和被打扰的频率。",
  },
  {
    question: "问卷内容会被别人原样看到吗？",
    answer:
      "不会。问卷用于生成匹配和匹配理由，普通用户看不到你的原始填写内容。",
  },
  {
    question: "这周不想参加，会影响之后吗？",
    answer:
      "不会。每一周都是独立决定，本周跳过不会影响下一周继续参与。",
  },
  {
    question: "如果这次没有匹配到怎么办？",
    answer:
      "页面会明确告诉你结果，你可以选择下周继续参加，或先调整资料与问卷再进入下一轮。",
  },
  {
    question: "点击联系之后会发生什么？",
    answer:
      "联系是正式动作。平台会向双方开放有限联系方式，并同步发送站内提醒。",
  },
];

export function buildHomeSteps({
  currentBatchLabel,
  signupDeadlineLabel,
  nextMatchTimeLabel,
}: BuildHomeStepsInput) {
  return [
    {
      number: "01",
      title: "填写一份认真问卷",
      description:
        "先把自己写清楚。兴趣、相处方式、边界感和关系期待，都会进入本周匹配。",
    },
    {
      number: "02",
      title: "决定是否加入本周",
      description: currentBatchLabel
        ? `你可以按周报名。当前批次 ${currentBatchLabel} 的截止时间是 ${signupDeadlineLabel}。`
        : "你可以按周报名。当前暂无开放批次，开放后这里会同步显示本轮截止时间。",
    },
    {
      number: "03",
      title: "在固定时间揭晓结果",
      description:
        nextMatchTimeLabel === "待定"
          ? "平台会在批次开放后显示本轮揭晓时间，并给出可读的匹配理由。"
          : `平台会在 ${nextMatchTimeLabel} 统一开放结果，并给出可读的匹配理由。`,
    },
  ] as const;
}
