import { z } from "zod";

import type {
  AdminDataMode,
  AdminUser,
  DemoPresetId,
  DemoState,
  MatchBatch,
  MatchRecord,
  MockProfile,
  NotificationItem,
  QuestionBankItem,
  QuestionnaireAnswers,
  QuestionnaireStatus,
  QuestionSection,
  UserSettings,
} from "@/features/mock-front/types";

export const BRAND_NAME = "NJU Date";
export const BRAND_MARK = "宁";
export const DEMO_NOW_LABEL = "2026年3月21日 星期六";
export const CURRENT_BATCH_LABEL = "第 13 周";
export const CURRENT_BATCH_RANGE = "2026年3月23日 - 2026年3月29日";
export const SIGNUP_DEADLINE_LABEL = "2026年3月23日 周一 23:59";
export const NEXT_MATCH_TIME_LABEL = "2026年3月24日 周二 20:30";
export const NEXT_MATCH_TIME_SHORT = "周二 20:30";

export const LOGIN_EMAIL_SCHEMA = z
  .string()
  .trim()
  .email("请输入有效邮箱")
  .refine(
    (value) => value.endsWith(".edu.cn") || value.endsWith(".edu"),
    "仅支持学校邮箱后缀",
  );

export const CONTACT_FORM_SCHEMA = z.object({
  name: z.string().trim().min(2, "请填写称呼"),
  email: z.string().trim().email("请填写可回复邮箱"),
  subject: z.string().trim().min(1, "请选择主题"),
  message: z.string().trim().min(12, "请补充更完整的说明"),
});

export const PUBLIC_NAV_ITEMS = [
  { href: "/about", label: "关于" },
] as const;

export const USER_NAV_ITEMS = [
  { href: "/app/dashboard", label: "主页" },
  { href: "/app/participation", label: "本周参与" },
  { href: "/app/matches", label: "匹配记录" },
  { href: "/app/questionnaire", label: "深度问卷" },
  { href: "/app/profile", label: "基本资料" },
  { href: "/app/settings", label: "设置" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "概览" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/questions", label: "题库管理" },
  { href: "/admin/batches", label: "匹配批次" },
  { href: "/admin/consult", label: "联系咨询" },
] as const;

export const HOME_HERO = {
  participationLabel: "本周已有 1,284 人选择加入",
  title: "让一次校内相遇，值得认真等待。",
  subtitle:
    "只需要认真填写一份问卷。每周二晚统一揭晓时，你会看到匹配结果，以及我们认为你们为什么值得认识。",
  caption: "仅限校内邮箱，不公开浏览，不做无限滑动。",
} as const;

export const HOME_COUNTDOWN_TARGET_ISO = "2026-03-24T20:30:00+08:00";
export const HOME_PLACEHOLDER_PHOTO = "/images/photos/photo_1.jpg";

export const HOME_STATS = [
  { value: "3126+", label: "已注册用户", note: "过去 30 天新增 218 人" },
  { value: "84%", label: "问卷完成率", note: "资料完整后才进入正式匹配" },
  { value: "968", label: "成功配对人数", note: "按周节奏持续增长" },
] as const;

export const HOME_STEPS = [
  {
    number: "01",
    title: "填写一份认真问卷",
    description:
      "先把自己写清楚。兴趣、相处方式、边界感和关系期待，都会进入本周匹配。",
  },
  {
    number: "02",
    title: "决定是否加入本周",
    description: `你可以按周报名。当前批次 ${CURRENT_BATCH_LABEL} 的截止时间是 ${SIGNUP_DEADLINE_LABEL}。`,
  },
  {
    number: "03",
    title: "在固定时间揭晓结果",
    description: `平台会在 ${NEXT_MATCH_TIME_LABEL} 统一开放结果，并给出可读的匹配理由。`,
  },
] as const;

export const HOME_FEATURES = [
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
] as const;

export const HOME_COMMITMENTS = [
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
] as const;

export const HOME_FAQ = [
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
      "联系是正式动作。当前 mock 版本会展示有限联系方式开放的结果，并同步站内提醒。",
  },
] as const;

export const ABOUT_SECTIONS = [
  {
    title: "为什么做这件事",
    paragraphs: [
      "校园里并不缺认真、温和、值得认识的人，缺的是一个不需要高频自我展示的入口。",
      "NJU Date 选择把核心放在问卷与每周节奏上，希望把注意力从“刷到更多”移回“看清楚彼此”。",
      "它不是一个公开社交平台，而是一个克制、低噪音、重视边界的连接机制。",
    ],
  },
  {
    title: "平台坚持的原则",
    bullets: [
      "不做公开浏览，不做公开搜索。",
      "参与按周决定，不制造持续在线压力。",
      "问卷优先于外貌和即时兴趣。",
      "联系是正式动作，不把后果模糊化。",
    ],
  },
  {
    title: "我们期待怎样的使用者",
    paragraphs: [
      "愿意认真填写，而不是敷衍作答。",
      "尊重他人的节奏和边界，不把平台当作无成本试探的工具。",
      "在联系前先想清楚，在联系后对自己的行为负责。",
    ],
  },
] as const;

export const PRIVACY_SECTIONS = [
  {
    title: "我们会收集什么",
    paragraphs: [
      "注册邮箱，用于校园身份验证与账户关联。",
      "基础资料与问卷内容，用于本周报名资格判断、匹配生成和结果展示。",
      "必要的站内操作记录，用于排查异常、处理咨询和满足最小必要的运营需求。",
    ],
  },
  {
    title: "我们如何使用这些信息",
    paragraphs: [
      "问卷和基础资料仅用于匹配与匹配理由生成，不用于公开展示广场。",
      "只有在你触发正式联系动作后，平台才会按规则开放有限联系信息。",
      "我们不会把你的资料出售、共享给商业广告方，也不会开放给普通用户搜索。",
    ],
  },
  {
    title: "你的权利",
    paragraphs: [
      "你可以修改资料、更新问卷、申请导出个人数据，也可以申请删除账户。",
      "正式法务文案后续可替换，但当前页面已经预留了删除、导出、联系平台的明确入口。",
    ],
  },
] as const;

export const CONTACT_SUBJECTS = [
  "账户问题",
  "匹配相关疑问",
  "隐私与数据请求",
  "功能建议",
  "举报或不适反馈",
  "其他",
] as const;

export const DASHBOARD_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    eyebrow: "本周安排",
    title: "第 13 周匹配将于 2026年3月24日 周二 20:30 公布",
    detail:
      "报名入口会在 2026年3月23日 周一 23:59 关闭。如本周临时维护，我们会在首页与站内同时公告。",
  },
  {
    id: "ann-2",
    eyebrow: "使用提醒",
    title: "联系动作会直接开放有限联系方式",
    detail:
      "请在点击前确认自己已经准备好继续认识对方。这不是轻量化的点赞动作。",
  },
] as const;

export const QUESTION_SECTIONS: QuestionSection[] = [
  {
    id: "daily",
    title: "日常节奏",
    subtitle: "你的生活是怎样展开的",
    description: "这一部分关注你的作息、安排方式和舒服的日常状态。",
    questions: [
      {
        id: "q-daily-1",
        order: 1,
        kind: "text",
        prompt: "描述一个你愿意重复很多次的普通晚上。",
        placeholder:
          "不需要很特别，只要是你真实会选择的样子，比如读书、散步、和朋友聊天或者独处。",
      },
      {
        id: "q-daily-2",
        order: 2,
        kind: "single",
        prompt: "面对时间安排时，你更接近哪一种？",
        options: [
          "先排清楚计划，按顺序推进会让我安心",
          "给自己留出弹性，过度安排会让我疲惫",
          "学习工作有计划，私人时间更随性",
          "完全看状态，不想预设固定模式",
        ],
      },
      {
        id: "q-daily-3",
        order: 3,
        kind: "multiple",
        prompt: "哪些场景最容易让你放松下来？",
        options: [
          "安静散步",
          "一起吃饭",
          "长时间对谈",
          "一起做事",
          "各自待着但知道对方在",
        ],
      },
    ],
  },
  {
    id: "communication",
    title: "沟通方式",
    subtitle: "你如何接近别人，也如何被接近",
    description: "这一部分关注你的表达习惯、回应节奏和边界感。",
    questions: [
      {
        id: "q-com-1",
        order: 1,
        kind: "text",
        prompt: "当你遇到情绪或压力时，最希望别人怎样靠近你？",
        placeholder: "可以写你希望被询问、被陪伴，或想先自己消化。",
      },
      {
        id: "q-com-2",
        order: 2,
        kind: "scale",
        prompt: "在关系里，保持稳定沟通频率对你有多重要？",
        scaleLeftLabel: "不太重要",
        scaleRightLabel: "非常重要",
      },
      {
        id: "q-com-3",
        order: 3,
        kind: "single",
        prompt: "如果意见不一致，你通常会怎么处理？",
        options: [
          "先把自己的想法说清楚，再一起讨论",
          "先缓一缓，等情绪稳定后再谈",
          "更愿意听对方说完，再决定怎么回应",
          "看人和场景，没有固定做法",
        ],
      },
    ],
  },
  {
    id: "values",
    title: "价值取向",
    subtitle: "你在意什么，如何理解关系",
    description: "这一部分不是标准答案，而是帮助平台理解你重视的东西。",
    questions: [
      {
        id: "q-val-1",
        order: 1,
        kind: "text",
        prompt: "最近一年里，有什么观念或经历明显改变了你看待关系的方式？",
        placeholder: "可以是一段经历，也可以是一句让你停下来思考的话。",
      },
      {
        id: "q-val-2",
        order: 2,
        kind: "single",
        prompt: "你更希望一段关系首先给你带来什么感受？",
        options: ["被理解", "被陪伴", "被激发", "足够轻松", "稳定踏实"],
      },
      {
        id: "q-val-3",
        order: 3,
        kind: "text",
        prompt: "有没有什么边界，是你希望认识之前就被尊重的？",
        placeholder: "比如沟通节奏、见面频率、表达方式等。",
      },
    ],
  },
  {
    id: "future",
    title: "关系期待",
    subtitle: "你准备怎样开始认识一个人",
    description: "这一部分帮助平台理解你现在的阶段与关系期待。",
    questions: [
      {
        id: "q-future-1",
        order: 1,
        kind: "single",
        prompt: "如果必须选一句来描述你现在的状态，会更接近哪一项？",
        options: [
          "想认真认识人，但不急于下结论",
          "更想慢慢建立信任，再决定关系方向",
          "希望先有高质量交流，再看能走多远",
          "当前以稳定、轻松、不消耗为优先",
        ],
      },
      {
        id: "q-future-2",
        order: 2,
        kind: "text",
        prompt: "如果平台只帮你带来一次相遇，你希望这次相遇具备什么气质？",
        placeholder: "可以写真诚、平静、有趣、克制、踏实，或者你自己的表达。",
      },
      {
        id: "q-future-3",
        order: 3,
        kind: "text",
        prompt: "还有什么你想在认识之前先告诉对方？",
        placeholder: "这是选填项，可以是一句坦白，也可以留空。",
        required: false,
      },
    ],
  },
];

export const QUESTION_BANK_ITEMS: QuestionBankItem[] =
  QUESTION_SECTIONS.flatMap((section) =>
    section.questions.map((question) => ({
      id: question.id,
      sectionId: section.id,
      type: question.kind,
      prompt: question.prompt,
      state: question.required === false ? "draft" : "published",
      responseCount: question.required === false ? 0 : 186 + question.order * 7,
    })),
  );

export const DEFAULT_PROFILE = (): MockProfile => ({
  nickname: "林见微",
  email: "linjianwei@smail.nju.edu.cn",
  department: "文学院",
  major: "汉语言文学",
  grade: "大三",
  gender: "女",
  targetPreference: "希望匹配到认真沟通、节奏温和的同学",
  bio: "喜欢图书馆、旧书店和走得很慢的夜路。比起热闹，我更依赖能把话说深一点的陪伴。",
  interests: ["阅读", "慢跑", "独立电影", "咖啡馆观察"],
  showNickname: true,
  publicFields: {
    department: true,
    grade: true,
    bio: true,
    interests: true,
  },
});

export const DEFAULT_SETTINGS = (): UserSettings => ({
  notifications: {
    matchResult: true,
    contactTrigger: true,
    weeklyReminder: false,
    platformDigest: false,
  },
  privacy: {
    showDepartment: true,
    showGrade: true,
    allowDirectContact: true,
  },
  accountState: "active",
  exportRequested: false,
});

const DRAFT_ANSWERS: QuestionnaireAnswers = {
  "q-daily-1":
    "如果那天没有被打断，我会在晚饭后散步半小时，然后去图书馆待到闭馆前，再回宿舍整理一点今天的情绪。",
  "q-daily-2": "学习工作有计划，私人时间更随性",
  "q-com-1": "我通常不希望别人立刻给建议，先让我把话说完、被认真听见会更重要。",
  "q-com-2": 4,
  "q-val-1":
    "过去一年我更接受“关系需要留白”这件事，好的连接不一定靠高频回应维持。",
};

const SUBMITTED_ANSWERS: QuestionnaireAnswers = {
  ...DRAFT_ANSWERS,
  "q-daily-3": ["安静散步", "长时间对谈", "各自待着但知道对方在"],
  "q-com-3": "先缓一缓，等情绪稳定后再谈",
  "q-val-2": "被理解",
  "q-val-3":
    "我不太适应被催着快速熟络，希望关系推进可以慢一点，不用为了证明热情而过度在线。",
  "q-future-1": "想认真认识人，但不急于下结论",
  "q-future-2":
    "我希望那次相遇是安静但不冷淡的，能让人自然放下戒备，有继续说下去的欲望。",
  "q-future-3":
    "如果我一开始话不多，不代表我没有兴趣，通常只是还在确认安全感。",
};

export function getQuestionnairePreset(
  status: QuestionnaireStatus,
): QuestionnaireAnswers {
  if (status === "submitted") {
    return { ...SUBMITTED_ANSWERS };
  }

  if (status === "draft") {
    return { ...DRAFT_ANSWERS };
  }

  return {};
}

export function createInitialDemoState(): DemoState {
  return {
    role: "guest",
    pendingEmail: "",
    profileCompleted: false,
    questionnaireStatus: "not_started",
    weeklyParticipation: "not_joined",
    latestMatchStatus: "no_match",
    contactStatus: "idle",
    adminDataMode: "filled",
    profile: DEFAULT_PROFILE(),
    questionnaireAnswers: {},
    lastQuestionnaireSavedAt: null,
    settings: DEFAULT_SETTINGS(),
  };
}

export function buildPresetState(
  current: DemoState,
  preset: DemoPresetId,
): DemoState {
  const next: DemoState = {
    ...current,
    profile: {
      ...current.profile,
      interests: [...current.profile.interests],
      publicFields: { ...current.profile.publicFields },
    },
    settings: {
      ...current.settings,
      notifications: { ...current.settings.notifications },
      privacy: { ...current.settings.privacy },
    },
  };

  if (preset === "visitor") {
    next.role = "guest";
    next.pendingEmail = "";
    return next;
  }

  if (preset === "admin_full" || preset === "admin_empty") {
    next.role = "admin";
    next.profileCompleted = true;
    next.questionnaireStatus = "submitted";
    next.questionnaireAnswers = getQuestionnairePreset("submitted");
    next.weeklyParticipation =
      preset === "admin_full" ? "joined" : "not_joined";
    next.latestMatchStatus = preset === "admin_full" ? "matched" : "no_match";
    next.contactStatus = preset === "admin_full" ? "contacted" : "idle";
    next.adminDataMode = preset === "admin_full" ? "filled" : "empty";
    return next;
  }

  next.role = "user";

  const scenarios = {
    new_user: {
      profileCompleted: false,
      questionnaireStatus: "not_started" as const,
      weeklyParticipation: "not_joined" as const,
      latestMatchStatus: "no_match" as const,
      contactStatus: "idle" as const,
    },
    draft_questionnaire: {
      profileCompleted: true,
      questionnaireStatus: "draft" as const,
      weeklyParticipation: "not_joined" as const,
      latestMatchStatus: "no_match" as const,
      contactStatus: "idle" as const,
    },
    ready_to_join: {
      profileCompleted: true,
      questionnaireStatus: "submitted" as const,
      weeklyParticipation: "not_joined" as const,
      latestMatchStatus: "no_match" as const,
      contactStatus: "idle" as const,
    },
    waiting_result: {
      profileCompleted: true,
      questionnaireStatus: "submitted" as const,
      weeklyParticipation: "joined" as const,
      latestMatchStatus: "waiting" as const,
      contactStatus: "idle" as const,
    },
    matched: {
      profileCompleted: true,
      questionnaireStatus: "submitted" as const,
      weeklyParticipation: "joined" as const,
      latestMatchStatus: "matched" as const,
      contactStatus: "idle" as const,
    },
    contacted: {
      profileCompleted: true,
      questionnaireStatus: "submitted" as const,
      weeklyParticipation: "joined" as const,
      latestMatchStatus: "matched" as const,
      contactStatus: "contacted" as const,
    },
    no_match: {
      profileCompleted: true,
      questionnaireStatus: "submitted" as const,
      weeklyParticipation: "joined" as const,
      latestMatchStatus: "no_match" as const,
      contactStatus: "idle" as const,
    },
  };

  const scenario = scenarios[preset];
  next.profileCompleted = scenario.profileCompleted;
  next.questionnaireStatus = scenario.questionnaireStatus;
  next.questionnaireAnswers = getQuestionnairePreset(
    scenario.questionnaireStatus,
  );
  next.weeklyParticipation = scenario.weeklyParticipation;
  next.latestMatchStatus = scenario.latestMatchStatus;
  next.contactStatus = scenario.contactStatus;
  return next;
}

export function isProfileReady(profile: MockProfile): boolean {
  return Boolean(
    profile.nickname.trim() &&
    profile.department.trim() &&
    profile.grade.trim() &&
    profile.targetPreference.trim(),
  );
}

export function getAnsweredQuestionCount(
  answers: QuestionnaireAnswers,
): number {
  return Object.values(answers).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "number") {
      return true;
    }

    return value.trim().length > 0;
  }).length;
}

export function getTotalRequiredQuestionCount(): number {
  return QUESTION_SECTIONS.flatMap((section) => section.questions).filter(
    (question) => question.required !== false,
  ).length;
}

export function getMissingRequiredQuestions(
  answers: QuestionnaireAnswers,
): string[] {
  return QUESTION_SECTIONS.flatMap((section) => section.questions)
    .filter((question) => question.required !== false)
    .filter((question) => {
      const answer = answers[question.id];
      if (Array.isArray(answer)) {
        return answer.length === 0;
      }

      if (typeof answer === "number") {
        return false;
      }

      return typeof answer !== "string" || answer.trim().length === 0;
    })
    .map((question) => question.prompt);
}

export function buildNotifications(state: DemoState): NotificationItem[] {
  const notifications: NotificationItem[] = [
    {
      id: "notif-1",
      title: "报名入口已开启",
      detail: `${CURRENT_BATCH_LABEL} 的参与开关已经开放，截止到 ${SIGNUP_DEADLINE_LABEL}。`,
      tone: "info",
      timestamp: "今天 09:00",
    },
  ];

  if (!state.profileCompleted) {
    notifications.push({
      id: "notif-profile",
      title: "还差一步：补齐基础资料",
      detail: "昵称、年级与匹配偏好补齐后，主页引导会自动更新。",
      tone: "warning",
      timestamp: "刚刚",
    });
  }

  if (state.questionnaireStatus !== "submitted") {
    notifications.push({
      id: "notif-questionnaire",
      title: "深度问卷尚未生效",
      detail: "只有正式提交后的问卷版本才会进入匹配流程。",
      tone: "warning",
      timestamp: "刚刚",
    });
  }

  if (state.latestMatchStatus === "matched") {
    notifications.push({
      id: "notif-match",
      title:
        state.contactStatus === "contacted"
          ? "你已触发正式联系"
          : "最新一轮匹配结果已生成",
      detail:
        state.contactStatus === "contacted"
          ? "平台已向双方开放有限联系方式，请在边界内继续认识。"
          : "可以进入匹配详情查看理由、有限资料与联系说明。",
      tone: state.contactStatus === "contacted" ? "success" : "info",
      timestamp: "昨天 20:30",
    });
  }

  if (state.latestMatchStatus === "no_match") {
    notifications.push({
      id: "notif-no-match",
      title: "本轮未匹配成功",
      detail: "这不代表你不适合使用平台，只代表这一轮没有合适结果。",
      tone: "info",
      timestamp: "昨天 20:30",
    });
  }

  return notifications;
}

export function buildMatchRecords(state: DemoState): MatchRecord[] {
  const latestRecord: MatchRecord =
    state.latestMatchStatus === "waiting"
      ? {
          id: "latest",
          batchLabel: CURRENT_BATCH_LABEL,
          publishedAt: NEXT_MATCH_TIME_LABEL,
          status: "waiting",
          preview:
            "本轮结果尚未开放，平台会在统一时间向所有已报名用户公布结果。",
          tags: ["统一公布", "无需反复刷新", "低打扰"],
        }
      : state.latestMatchStatus === "no_match"
        ? {
            id: "latest",
            batchLabel: CURRENT_BATCH_LABEL,
            publishedAt: NEXT_MATCH_TIME_LABEL,
            status: "no_match",
            preview:
              "本轮没有生成合适匹配。你仍然可以下周继续参与，也可以先补充资料与问卷。",
            tags: ["本轮未匹配", "可继续参与", "友好空状态"],
          }
        : {
            id: "latest",
            batchLabel: CURRENT_BATCH_LABEL,
            publishedAt: NEXT_MATCH_TIME_LABEL,
            status:
              state.contactStatus === "contacted" ? "contacted" : "matched",
            score: 88,
            counterpartName: "沈澄",
            counterpartDepartment: "哲学系",
            counterpartGrade: "大四",
            preview:
              "你们都偏好低噪音的相处方式，也都把“可以安静地说真话”视作关系里重要的部分。",
            tags: ["沟通边界", "生活节奏", "关系期待"],
            reasons: [
              "你们都不把热闹感当成亲密的证明，更在意相处时能否自然地放松下来。",
              "在对待关系推进的节奏上，你们都倾向于慢一点、真一点，而不是快速确认。",
              "你们都提到需要稳定但不过度黏连的联系，这让相处方式有较高一致性。",
            ],
            sharedSignals: ["重视安静相处", "接受留白", "希望关系推进有节奏"],
            highlights: [
              {
                label: "对方的有限资料",
                value: "哲学系，大四，愿意在匹配中展示昵称与年级。",
              },
              {
                label: "一段被提炼出的自我描述",
                value:
                  "偏爱慢一点的交流，不擅长寒暄，但愿意在熟悉后把很多想法讲清楚。",
              },
              {
                label: "关系期待",
                value: "希望先建立稳定的理解，再讨论更长远的方向。",
              },
            ],
            contactEmail: "shencheng@smail.nju.edu.cn",
          };

  return [
    latestRecord,
    {
      id: "w12",
      batchLabel: "第 12 周",
      publishedAt: "2026年3月17日 周二 20:30",
      status: "contacted",
      score: 84,
      counterpartName: "陈聿",
      counterpartDepartment: "社会学院",
      counterpartGrade: "研一",
      preview:
        "你们都把“说得慢一点但说真一点”放在前面，也都偏好稳定而克制的相处方式。",
      tags: ["价值观相近", "克制表达", "已联系"],
      reasons: [
        "你们都在问卷里提到，关系里最难得的是可以不表演。",
        "你们对时间安排的偏好接近，都更喜欢提前给彼此留出空间。",
      ],
      sharedSignals: ["反感高频消耗", "愿意认真沟通"],
      highlights: [
        {
          label: "对方的有限资料",
          value: "社会学院，研一，展示昵称与院系。",
        },
      ],
      contactEmail: "chenyu@smail.nju.edu.cn",
    },
    {
      id: "w11",
      batchLabel: "第 11 周",
      publishedAt: "2026年3月10日 周二 20:30",
      status: "archived",
      score: 80,
      counterpartName: "许明",
      counterpartDepartment: "历史学院",
      counterpartGrade: "大四",
      preview:
        "你们在“需要独处但不排斥亲密”这件事上给出了很接近的答案，这让相处有了天然的理解基础。",
      tags: ["历史记录", "已归档", "可回看"],
    },
    {
      id: "w10",
      batchLabel: "第 10 周",
      publishedAt: "2026年3月3日 周二 20:30",
      status: "no_match",
      preview:
        "这一轮没有生成合适匹配结果。平台保留了你的资料，下周仍可继续参加。",
      tags: ["未匹配", "可继续", "历史记录"],
    },
  ];
}

export function getMatchRecordById(
  state: DemoState,
  id: string,
): MatchRecord | null {
  return buildMatchRecords(state).find((record) => record.id === id) ?? null;
}

export function buildAdminUsers(mode: AdminDataMode): AdminUser[] {
  if (mode === "empty") {
    return [];
  }

  return [
    {
      id: "u-1",
      nickname: "林见微",
      emailMask: "lin***@smail.nju.edu.cn",
      department: "文学院",
      grade: "大三",
      joinedAt: "2026-02-11",
      questionnaireComplete: true,
      participatedThisWeek: true,
      participationCount: 6,
      status: "active",
    },
    {
      id: "u-2",
      nickname: "沈澄",
      emailMask: "she***@smail.nju.edu.cn",
      department: "哲学系",
      grade: "大四",
      joinedAt: "2026-02-18",
      questionnaireComplete: true,
      participatedThisWeek: true,
      participationCount: 5,
      status: "active",
    },
    {
      id: "u-3",
      nickname: "赵屿",
      emailMask: "zha***@smail.nju.edu.cn",
      department: "数学系",
      grade: "研二",
      joinedAt: "2026-03-02",
      questionnaireComplete: false,
      participatedThisWeek: false,
      participationCount: 0,
      status: "paused",
    },
    {
      id: "u-4",
      nickname: "周庭",
      emailMask: "zho***@smail.nju.edu.cn",
      department: "法学院",
      grade: "大四",
      joinedAt: "2026-01-28",
      questionnaireComplete: true,
      participatedThisWeek: false,
      participationCount: 7,
      status: "restricted",
    },
  ];
}

export function buildMatchBatches(mode: AdminDataMode): MatchBatch[] {
  if (mode === "empty") {
    return [
      {
        id: "batch-13",
        label: CURRENT_BATCH_LABEL,
        dateRange: CURRENT_BATCH_RANGE,
        signupDeadline: SIGNUP_DEADLINE_LABEL,
        publishTime: NEXT_MATCH_TIME_LABEL,
        participants: 0,
        matchedPairs: null,
        unmatchedUsers: null,
        contactTriggers: null,
        status: "open",
      },
    ];
  }

  return [
    {
      id: "batch-13",
      label: CURRENT_BATCH_LABEL,
      dateRange: CURRENT_BATCH_RANGE,
      signupDeadline: SIGNUP_DEADLINE_LABEL,
      publishTime: NEXT_MATCH_TIME_LABEL,
      participants: 86,
      matchedPairs: null,
      unmatchedUsers: null,
      contactTriggers: null,
      status: "open",
    },
    {
      id: "batch-12",
      label: "第 12 周",
      dateRange: "2026年3月16日 - 2026年3月22日",
      signupDeadline: "2026年3月16日 周一 23:59",
      publishTime: "2026年3月17日 周二 20:30",
      participants: 82,
      matchedPairs: 39,
      unmatchedUsers: 4,
      contactTriggers: 19,
      status: "completed",
    },
    {
      id: "batch-11",
      label: "第 11 周",
      dateRange: "2026年3月9日 - 2026年3月15日",
      signupDeadline: "2026年3月9日 周一 23:59",
      publishTime: "2026年3月10日 周二 20:30",
      participants: 78,
      matchedPairs: 36,
      unmatchedUsers: 6,
      contactTriggers: 15,
      status: "completed",
    },
  ];
}

export function buildConsultations(mode: AdminDataMode) {
  if (mode === "empty") {
    return [];
  }

  return [
    {
      id: "con-1",
      sender: "us***@smail.nju.edu.cn",
      topic: "账户问题",
      message:
        "我使用学校邮箱提交验证码后没有收到邮件，想确认是不是我填错地址了，或者系统有延迟。",
      createdAt: "2026-03-20 14:32",
      status: "pending",
      priority: "normal",
    },
    {
      id: "con-2",
      sender: "zh***@smail.nju.edu.cn",
      topic: "举报或不适反馈",
      message:
        "我已经触发联系，但后续收到的表达让我不舒服，希望平台介入并记录这次反馈。",
      createdAt: "2026-03-19 22:05",
      status: "resolved",
      priority: "urgent",
      reply:
        "已收到反馈，我们已暂停相关账号的后续参与资格，并保留进一步沟通入口。如需要，我们会继续跟进。",
      replyAt: "2026-03-19 22:48",
    },
    {
      id: "con-3",
      sender: "li***@smail.nju.edu.cn",
      topic: "隐私与数据请求",
      message:
        "我想知道当前版本是否已经支持导出问卷内容和历史匹配记录，如果还没有，希望能知道预计处理方式。",
      createdAt: "2026-03-18 09:18",
      status: "replied",
      priority: "normal",
      reply:
        "当前前端已经提供导出申请入口，后续会接真实处理链路。你的需求已记录，正式上线前会补齐。",
      replyAt: "2026-03-18 10:02",
    },
  ];
}

export function buildAdminOverview(mode: AdminDataMode) {
  if (mode === "empty") {
    return {
      stats: [
        { label: "注册用户", value: 0, sublabel: "尚无数据" },
        { label: "完成问卷", value: 0, sublabel: "完成率 0%" },
        { label: "本周参与", value: 0, sublabel: "等待开放" },
        { label: "待处理咨询", value: 0, sublabel: "空状态" },
      ],
      weeklySeries: [
        { label: "第9周", participants: 0, pairs: 0, contacts: 0 },
        { label: "第10周", participants: 0, pairs: 0, contacts: 0 },
        { label: "第11周", participants: 0, pairs: 0, contacts: 0 },
        { label: "第12周", participants: 0, pairs: 0, contacts: 0 },
      ],
      registrationSeries: [0, 0, 0, 0, 0, 0],
    };
  }

  return {
    stats: [
      { label: "注册用户", value: 312, sublabel: "近 30 天新增 18" },
      { label: "完成问卷", value: 248, sublabel: "完成率 79%" },
      { label: "本周参与", value: 86, sublabel: "较上周 +8" },
      { label: "待处理咨询", value: 3, sublabel: "含 1 条紧急反馈" },
    ],
    weeklySeries: [
      { label: "第9周", participants: 63, pairs: 29, contacts: 11 },
      { label: "第10周", participants: 71, pairs: 33, contacts: 14 },
      { label: "第11周", participants: 78, pairs: 36, contacts: 15 },
      { label: "第12周", participants: 82, pairs: 39, contacts: 19 },
    ],
    registrationSeries: [18, 32, 41, 53, 48, 67],
  };
}
