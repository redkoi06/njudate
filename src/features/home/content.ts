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

export const HOME_PLACEHOLDER_PHOTO = "/images/photos/photo_1.jpg";

export const HOME_FEATURES: HomeFeature[] = [
  {
    title: "极低社交压力",
    description:
      "你只需要做好你自己即可，不需要一昧迎合别人。当你对自己的描述越精确，遇见合适的ta概率自然越大。",
  },
  {
    title: "可控社交节奏",
    description:
      "是否参加完全由你按周决定，结果统一揭晓，不需要反复刷新，自动排除无效信息。",
  },
  {
    title: "清晰社交边界",
    description:
      "不公开浏览，不开放搜索，联系方式按规则开放。",
  },
  {
    title: "强调深度联结",
    description:
      "一段关系远远不只是一个名分。我们不保证遇见的人百分百与你同频，但我们希望给每个人创造深度接触的机会。展现真实的自己，然后试着感受不同思维的碰撞，探索不一样的选择。",
  },
];

export const HOME_COMMITMENTS: HomeCommitment[] = [
  {
    title: "只对本校学生开放",
    description: "使用学校邮箱注册登陆，参与者始终限定本校。",
  },
  {
    title: "每周统一揭晓",
    description: "配对不是即时反馈，而是一次郑重决定。",
  },
  {
    title: "尊重隐私和边界",
    description: "只有你主动选择联系，才会按规则开放有限联系方式。",
  },
];

export const HOME_FAQ: HomeFaqItem[] = [
  {
    question: "谁可以使用 NJU DATE？",
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

export function buildHomeSteps() {
  return [
    {
      number: "01",
      title: "试以此简，澄怀观心",
      description:
        "我们不随波逐流。填写问卷的同时，重新构建自己的精神原乡。兴趣爱好，相处方式，边界感和关系期待，都由你自己决定。",
    },
    {
      number: "02",
      title: "诚心作缄，共赴一纸云蓝",
      description:
        "欲速则不达，你可以自由把握节奏，选择是否参加。等你准备好，青鸾随时恭候。"
    },
    {
      number: "03",
      title: "期于旧约，静候锦书而至",
      description:
        "你会在每周三晚上收到信笺。先以笺识人，再与合适的人相遇。"
    },
  ] as const;
}
