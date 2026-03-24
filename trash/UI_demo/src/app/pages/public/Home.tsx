import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Shield, Clock, Heart, BookOpen } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: '深度问卷',
      desc: '不是择偶条件清单，而是关于你是谁的真实描述。我们花时间了解你的内心，再做匹配。',
    },
    {
      icon: Clock,
      title: '固定周期',
      desc: '每周自主决定是否参与，每周五固定收到匹配结果。节奏平稳，不催促，不焦虑。',
    },
    {
      icon: Heart,
      title: '一次一人',
      desc: '每次只匹配一个人，附上详细的匹配理由。认真对待每一次连接，而不是无尽的刷选。',
    },
    {
      icon: Shield,
      title: '安全克制',
      desc: '仅限校园邮箱注册，信息不对外公开。联系需双方确认，保护每个人的边界与安全。',
    },
  ];

  const steps = [
    { num: '01', title: '注册', desc: '使用学校邮箱注册，完成身份验证。' },
    { num: '02', title: '填写问卷', desc: '用约20分钟完成深度问卷，讲述真实的你。' },
    { num: '03', title: '决定参与', desc: '每周一到周四，自主决定本周是否参与匹配。' },
    { num: '04', title: '收到匹配', desc: '每周五晚八点，收到匹配结果与匹配理由。' },
    { num: '05', title: '联系TA', desc: '阅读匹配信，觉得合适就点击联系，开始认识。' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-8 pt-28 pb-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm tracking-widest mb-8" style={{ color: 'var(--wine-medium)', letterSpacing: '0.2em' }}>校园内部认真匹配平台</p>
            <h1 className="mb-6" style={{ fontSize: '2.75rem', lineHeight: 1.4, fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
              等待一封<br />关于你的信
            </h1>
            <p className="text-base leading-relaxed mb-12 mx-auto max-w-lg" style={{ color: 'var(--text-secondary)' }}>
              同频不是速配，也不是算法推荐。<br />
              我们相信，好的相遇需要时间、需要认真，<br />
              也需要一点点等待的耐心。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(isLoggedIn ? '/app/dashboard' : '/login')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm transition-all"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                {isLoggedIn ? '进入应用' : '开始使用'}
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm border transition-all"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                了解更多
              </button>
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="border-t" style={{ borderColor: 'var(--cream-border)' }} />
        </div>
      </section>

      {/* Divider text */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-xl leading-relaxed" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-secondary)', fontWeight: 300 }}>
              "我们不希望你刷完五十个人还觉得空洞。<br />
              我们希望你读到一封信，然后想——<br />
              <em style={{ color: 'var(--wine)', fontStyle: 'normal' }}>也许值得认识一下。</em>"
            </blockquote>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t" style={{ borderColor: 'var(--cream-border)' }}>
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>核心理念</p>
            <h2 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              不同于你见过的任何平台
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-7 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: 'var(--wine-light)' }}>
                  <f.icon size={17} style={{ color: 'var(--wine)' }} />
                </div>
                <h3 className="text-base mb-3" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t" style={{ borderColor: 'var(--cream-border)', background: 'var(--cream-warm)' }}>
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>流程</p>
            <h2 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 400 }}>
              简单，克制，有节奏
            </h2>
          </div>
          <div className="flex flex-col md:flex-row gap-0 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex-1 relative">
                <div className={`px-6 py-8 ${i < steps.length - 1 ? 'md:border-r' : ''}`} style={{ borderColor: 'var(--cream-border)' }}>
                  <p className="text-xs mb-4 tracking-widest" style={{ color: 'var(--wine-medium)', fontFamily: 'Noto Serif SC, serif' }}>{step.num}</p>
                  <h3 className="text-base mb-2" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Mini */}
      <section className="py-20 border-t" style={{ borderColor: 'var(--cream-border)' }}>
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>常见问题</p>
              <h2 className="mb-8" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 400 }}>
                你可能想知道的
              </h2>
              <div className="space-y-6">
                {[
                  { q: '这是恋爱交友平台吗？', a: '我们称它为"认真相遇"平台。我们不预设结果，相遇是否发展成友谊、恋情或其他，由你们自己决定。' },
                  { q: '我的信息会被谁看到？', a: '问卷内容仅供匹配算法使用，不对其他用户公开。匹配时只会分享对方自愿公开的部分内容。' },
                  { q: '每周一定要参与吗？', a: '完全不用。每周都是全新的独立决定，本周不参与不影响下周。你随时可以暂停。' },
                  { q: '如果对匹配结果不感兴趣呢？', a: '不联系就好了。没有强制，不会催促。等待下周新的可能。' },
                ].map((item, i) => (
                  <div key={i} className="pb-6 border-b last:border-0" style={{ borderColor: 'var(--cream-border)' }}>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.q}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8" style={{ background: 'var(--wine-light)' }}>
                <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '2.5rem', color: 'var(--wine)', fontWeight: 300 }}>缘</span>
              </div>
              <h3 className="text-xl mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
                准备好了吗？
              </h3>
              <p className="text-sm mb-8 max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                用你的学校邮箱注册，花二十分钟填写问卷，然后等待属于你的那封信。
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm transition-all"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                用学校邮箱注册
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
