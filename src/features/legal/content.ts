export type LegalInlineSegment = {
  text: string;
  bold?: boolean;
  underline?: boolean;
};

export type LegalRichText = readonly LegalInlineSegment[];

type LegalSummaryItem = {
  title: LegalRichText;
  description: LegalRichText;
};

type LegalSection = {
  id: string;
  title: LegalRichText;
  paragraphs: readonly LegalRichText[];
  tone?: "default" | "warning" | "calm";
};

export const PRIVACY_PAGE_CONTENT = {
  eyebrow: "用户服务与隐私协议",
  title: "《NJU Date 用户服务与隐私协议》",
  titleSegments: [
    { text: "《NJU Date 用户服务与隐私协议》", bold: true },
  ] as LegalRichText,
  description: "为了给您提供安全、有趣的校园匹配体验，请您仔细阅读本协议。",
  introSegments: [
    { text: "欢迎来到 ", bold: true },
    { text: "NJU Date！", bold: true },
    {
      text: " 为了给您提供安全、有趣的校园匹配体验，请您仔细阅读本协议。",
    },
  ] as LegalRichText,
  points: [
    "我们只服务小蓝鲸：后缀邮箱验证。",
    "社交步调由你定义：只有在你主动授权后，才参与匹配。",
    "全链路加密防护：邮箱等个人信息与问卷答案分离加密存储，后台无法直接关联。",
  ] as const,
  summaryTitle: [
    { text: "💡 太长不看版（核心摘要）：", bold: true },
  ] as LegalRichText,
  summaryItems: [
    {
      title: [
        { text: "我们只", bold: true },
        { text: "服务小蓝鲸", bold: true },
      ] as LegalRichText,
      description: [{ text: "后缀邮箱验证。" }] as LegalRichText,
    },
    {
      title: [{ text: "社交步调由你定义", bold: true }] as LegalRichText,
      description: [
        { text: "只有在你主动授权后，才参与匹配。" },
      ] as LegalRichText,
    },
    {
      title: [{ text: "全链路加密防护", bold: true }] as LegalRichText,
      description: [
        {
          text: "邮箱等个人信息与问卷答案分离加密存储，后台无法直接关联。",
        },
      ] as LegalRichText,
    },
  ] as const satisfies readonly LegalSummaryItem[],
  sections: [
    {
      id: "account",
      title: [{ text: "一、账号注册与用户规范", bold: true }] as LegalRichText,
      paragraphs: [
        [
          { text: "使用资格：", bold: true },
          {
            text: " 本平台专为南京大学学生提供，您需要使用有效的南大学生邮箱进行身份验证。",
          },
        ],
        [
          { text: "行为准则：", bold: true },
          {
            text: " 我们希望您在 NJU Date 上提供真实的信息，虚假信息会影响匹配的精确度。发送垃圾邮件、骚扰其他用户、发表不当言论或进行任何违法/违规活动，后果自负。",
          },
        ],
        [
          { text: "账号处置权：", bold: true },
          {
            text: " 如发现您违反上述规范，NJU Date Teams有权限制、暂停或终止您的账号使用权。",
          },
        ],
      ] as const,
      tone: "default",
    },
    {
      id: "collection",
      title: [
        { text: "二、我们如何收集和使用信息", bold: true },
      ] as LegalRichText,
      paragraphs: [
        [{ text: "为了让匹配更精准，我们会收集并使用以下必要信息：" }],
        [
          { text: "账号与身份信息：", bold: true },
          {
            text: " 您的南大邮箱（仅作验证及通知使用，只有匹配成功且至少其中一方选择联系才会向对方提供）。",
          },
        ],
        [
          { text: "匹配数据：", bold: true },
          {
            text: " 您填写的基本信息，问卷数据，以及您的互动记录（如参与配对的记录）。这些数据仅用于",
          },
          { text: "运行和优化匹配算法", bold: true },
          { text: "。" },
        ],
      ] as const,
      tone: "default",
    },
    {
      id: "storage",
      title: [
        { text: "三、数据存储、安全与共享", bold: true },
      ] as LegalRichText,
      paragraphs: [
        [
          { text: "分布式隔离：", bold: true },
          {
            text: " 您的数据安全是我们的底线。您的邮箱地址与问卷答案在后端",
          },
          { text: "分开独立保存", bold: true },
          {
            text: "（问卷数据仅以随机生成的 index存储）。针对用户敏感索引，我们实行了",
          },
          { text: "非对称加密逻辑与分布式存储方案", bold: true },
          {
            text: "，即使是NJU Date Teams，也无法将您的真实身份与问卷选项直接关联。",
          },
        ],
        [
          { text: "加密技术：", bold: true },
          { text: " 在数据流转生命周期中，我们部署了" },
          { text: "全链路 TLS 1.3 传输层加密协议", bold: true },
          { text: "，确保信息在公共网络传输过程中的绝对私密性。" },
        ],
        [
          { text: "数据共享：", bold: true },
          { text: " 我们" },
          { text: "绝对不会", bold: true },
          {
            text: "出售、出租或向任何第三方商业机构分享您的个人信息。在法律要求（如配合执法机构合法请求）或经您明确授权的情况下除外。",
          },
        ],
      ] as const,
      tone: "calm",
    },
    {
      id: "disclaimer",
      title: [{ text: "四、免责声明", bold: true }] as LegalRichText,
      paragraphs: [
        [
          { text: "交友安全风险：", bold: true },
          {
            text: " NJU Date 仅提供用户之间的线上匹配服务。我们无法完全核实每一位用户的真实意图。",
          },
          {
            text: "请您在后续分享个人信息、手机号或决定线下见面时，务必保持警惕、合理评估风险。对于用户之间产生的任何纠纷或损害，NJU Date 团队不承担法律责任。",
            bold: true,
          },
        ],
        [
          { text: "算法局限性：", bold: true },
          {
            text: " 匹配由算法基于您的问卷生成。问卷答案的准确性会直接影响匹配结果，也不代表对人际关系的绝对保证。",
          },
        ],
        [
          { text: "服务稳定性：", bold: true },
          {
            text: " 尽管存在因不可抗力、黑客攻击或系统维护导致的数据丢失或服务中断的风险，但我们会尽最大努力维护系统正常运行。",
          },
        ],
      ] as const,
      tone: "warning",
    },
    {
      id: "rights",
      title: [
        { text: "五、您的权利：注销与数据删除", bold: true },
      ] as LegalRichText,
      paragraphs: [
        [{ text: "您对自己的数据拥有完全的控制权：" }],
        [
          {
            text: "您可随时在“个人资料”页面注销账号。注销后，您的账号将无法恢复，您的问卷数据将被彻底匿名化（移除所有可识别字段），仅作为脱敏数据保留用于算法迭代。",
          },
        ],
      ] as const,
      tone: "default",
    },
    {
      id: "changes",
      title: [{ text: "六、协议变更与联系方式", bold: true }] as LegalRichText,
      paragraphs: [
        [
          {
            text: "如本协议发生重大变更，我们会通过平台公告或邮件提前 7 天通知您。若您在变更后继续使用 NJU Date，即视为接受新协议。",
          },
        ],
        [
          {
            text: "本平台功能的最终解释权归属NJU Date Teams。如有任何关于隐私或功能的疑问，欢迎随时联系我们。",
          },
        ],
      ] as const,
      tone: "default",
    },
  ] as const satisfies readonly LegalSection[],
} as const;

export const USER_AGREEMENT_DIALOG_TITLE = "《NJU Date 用户服务与隐私协议》";
