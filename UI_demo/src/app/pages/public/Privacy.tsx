export function Privacy() {
  const sections = [
    {
      title: '我们收集什么信息',
      content: [
        '注册信息：学校邮箱地址，用于身份验证和账户关联。我们不要求你填写真实姓名，你可以使用任何你喜欢的昵称。',
        '问卷内容：你在深度问卷中填写的回答，包括关于你的个性、价值观、生活方式的描述。这些信息是匹配的核心依据。',
        '基本资料：年级、院系，用于匹配算法中的基本筛选。',
        '使用数据：平台使用日志，用于改善用户体验，不包含任何个人可识别信息。',
      ],
    },
    {
      title: '我们如何使用你的信息',
      content: [
        '匹配算法：问卷数据和基本资料用于生成每周匹配结果。',
        '匹配展示：匹配成功时，对方会看到你的昵称、院系年级，以及从问卷中提取的部分内容（非完整问卷）。我们会在展示前经过筛选和脱敏处理。',
        '服务改进：匿名化的汇总数据用于改善匹配算法质量。',
        '我们不会将你的信息用于广告、商业变现，或出售给任何第三方。',
      ],
    },
    {
      title: '信息展示规则',
      content: [
        '仅在你参与匹配的周次，你的信息才会进入匹配池。',
        '你的完整问卷内容对其他用户不可见。只有经过提炼的部分内容会在匹配时展示。',
        '你可以随时在设置中查看和修改你公开的信息范围。',
        '联系信息（邮箱）仅在双方均确认愿意联系后才会对对方可见。',
      ],
    },
    {
      title: '数据安全',
      content: [
        '所有数据传输通过 HTTPS 加密。',
        '数据库访问受到严格权限控制，仅有必要的运维人员可以访问。',
        '运维人员访问数据有完整的操作日志，确保可追溯性。',
        '如发生数据安全事件，我们会在24小时内通过注册邮箱通知相关用户。',
      ],
    },
    {
      title: '你的权利',
      content: [
        '查阅权：你可以随时在"我的资料"页面查看我们持有的你的数据。',
        '修改权：你可以修改你的问卷回答、基本资料和昵称。',
        '删除权：你可以在设置中申请删除账户，我们将在7个工作日内完成所有数据的删除。',
        '导出权：你可以申请导出你的问卷数据，我们将以可读格式发送到你的注册邮箱。',
      ],
    },
    {
      title: '联系我们',
      content: [
        '如果你对隐私政策有任何疑问，或希望行使上述权利，请发送邮件至：privacy@campus-match.edu.cn',
        '我们会在3个工作日内回复。',
      ],
    },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-widest mb-6" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>隐私承诺</p>
        <h1 className="mb-4" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.5 }}>
          我们如何保护你的隐私
        </h1>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          最后更新：2025年3月 · 如有变更，我们会通过邮件通知你
        </p>

        <div className="p-6 rounded-xl mb-10 border" style={{ background: 'var(--wine-pale)', borderColor: 'var(--wine-light)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--wine-deep)' }}>
            简版：你的问卷内容只用于匹配，不对任何人完整公开。你的联系方式只在双方均同意后才会互相可见。你可以随时删除账户和数据。
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-base mb-5" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{section.title}</h2>
              <div className="space-y-3">
                {section.content.map((para, j) => (
                  <p key={j} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {para}
                  </p>
                ))}
              </div>
              {i < sections.length - 1 && (
                <div className="mt-10 border-t" style={{ borderColor: 'var(--cream-border)' }} />
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
