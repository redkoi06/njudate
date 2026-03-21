import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Heart, Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const mockMatches: Record<string, {
  id: string;
  week: number;
  weekLabel: string;
  date: string;
  matchTime: string;
  name: string;
  dept: string;
  grade: string;
  status: string;
  matchScore: number;
  reason: string[];
  sharedValues: string[];
  sharedInterests: string[];
  profileHighlights: { label: string; value: string }[];
  contactEmail?: string;
}> = {
  m001: {
    id: 'm001',
    week: 12,
    weekLabel: '第 12 周',
    date: '2025年3月21日',
    matchTime: '2025年3月21日 20:00',
    name: '陈 ·',
    dept: '哲学系',
    grade: '大四',
    status: 'contacted',
    matchScore: 87,
    reason: [
      '你们都在问卷中提到了对「独处」的相似理解——不是回避关系，而是需要空间来整理自己。这是一种少见的自知。',
      '在关于未来的问题上，你们都表达了"开放但不焦虑"的态度，不急于给生活下定论，愿意在不确定中认真生活。',
      '你们对"好的关系"的定义也有共鸣：不需要时刻在线，但需要在真正重要的时候彼此在场。',
    ],
    sharedValues: ['独处的价值', '对未来的开放态度', '认真而不执念'],
    sharedInterests: ['阅读', '长途散步', '独立电影'],
    profileHighlights: [
      { label: '他/她的描述', value: '一个习惯在图书馆工作到很晚的人。喜欢问没有答案的问题，但不会因此焦虑。' },
      { label: '关系期待', value: '不急，但希望是真的。' },
      { label: '一句自白', value: '我可能需要一段时间才会打开，但打开之后就是认真的。' },
    ],
    contactEmail: 'ch***@campus.edu.cn',
  },
  m002: {
    id: 'm002',
    week: 11,
    weekLabel: '第 11 周',
    date: '2025年3月14日',
    matchTime: '2025年3月14日 20:00',
    name: '沈 ·',
    dept: '社会学系',
    grade: '研二',
    status: 'read',
    matchScore: 82,
    reason: [
      '在关于「意义」的问题上，你们给出了截然不同但互相补足的答案。你倾向于从内部寻找，TA 更多从外部关系中获取——这种差异本身可能就是对话的起点。',
      'TA 对孤独的理解和你有着微妙的呼应：都承认孤独的存在，但不将其定义为问题。',
      '你们在"轻松而不表浅"这一关系取向上高度一致。',
    ],
    sharedValues: ['对孤独的平和态度', '轻松而有深度', '真诚优先于礼貌'],
    sharedInterests: ['社会议题', '写作', '慢旅行'],
    profileHighlights: [
      { label: '他/她的描述', value: '一个在人群中安静的人，一对一时话会变多。' },
      { label: '关系期待', value: '想要有人能在深夜聊很久，但白天各做各的事。' },
      { label: '一句自白', value: '我是一个需要一点时间才能信任的人，但一旦信任就是很好的朋友。' },
    ],
  },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  contacted: { label: '已联系', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  read: { label: '已读取', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  unread: { label: '未读取', color: 'var(--wine)', bg: 'var(--wine-light)' },
  expired: { label: '已过期', color: 'var(--text-muted)', bg: 'var(--muted)' },
};

export function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const match = id ? mockMatches[id] : null;

  if (!match) {
    return (
      <div>
        <button onClick={() => navigate('/app/matches')} className="flex items-center gap-2 text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> 返回
        </button>
        <div className="py-20 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>匹配记录不存在或已过期</p>
        </div>
      </div>
    );
  }

  const st = statusConfig[match.status] || statusConfig.read;
  const isExpired = match.status === 'expired';
  const isContacted = match.status === 'contacted';

  const handleContact = async () => {
    setContactLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setContactLoading(false);
    setContactSent(true);
    setShowContactModal(false);
  };

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/app/matches')} className="flex items-center gap-2 text-sm mb-8 transition-colors" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={14} />
        返回匹配记录
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs tracking-widest" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>{match.weekLabel} · {match.date}</p>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
          </div>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            你的匹配信
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-2xl" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)', fontWeight: 300 }}>{match.matchScore}%</p>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>匹配度</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="col-span-1 space-y-4">
          {/* Avatar card */}
          <div className="p-6 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--wine-light)' }}>
              <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--wine)', fontWeight: 300 }}>{match.name[0]}</span>
            </div>
            <p className="text-base mb-0.5" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{match.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{match.dept} · {match.grade}</p>

            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--cream-border)' }}>
              {isContacted || contactSent ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={14} style={{ color: 'var(--status-success)' }} />
                  <span className="text-xs" style={{ color: 'var(--status-success)' }}>已发送联系请求</span>
                </div>
              ) : isExpired ? (
                <div className="flex items-center justify-center gap-2">
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>匹配已过期</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{ background: 'var(--wine)', color: 'var(--cream)' }}
                >
                  <Heart size={14} />
                  联系 TA
                </button>
              )}
            </div>
          </div>

          {/* Shared */}
          <div className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>共同兴趣</p>
            <div className="flex flex-wrap gap-1.5">
              {match.sharedInterests.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--wine-light)', color: 'var(--wine)' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Contact info (if contacted) */}
          {(isContacted || contactSent) && match.contactEmail && (
            <div className="p-5 rounded-xl border" style={{ background: 'var(--status-success-bg)', borderColor: 'rgba(90,138,110,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={13} style={{ color: 'var(--status-success)' }} />
                <p className="text-xs" style={{ color: 'var(--status-success)', fontWeight: 500 }}>联系邮箱</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{match.contactEmail}</p>
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>对方已确认联系</p>
            </div>
          )}
        </div>

        {/* Right: Main content */}
        <div className="col-span-2 space-y-5">
          {/* Reason */}
          <div className="p-7 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-5" style={{ color: 'var(--wine-medium)', letterSpacing: '0.1em' }}>匹配理由</p>
            <div className="space-y-5">
              {match.reason.map((r, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--wine-light)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--wine)', fontFamily: 'Noto Serif SC, serif' }}>{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shared values */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-4" style={{ color: 'var(--wine-medium)', letterSpacing: '0.1em' }}>共鸣点</p>
            <div className="space-y-2.5">
              {match.sharedValues.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--wine-medium)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Profile highlights */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-5" style={{ color: 'var(--wine-medium)', letterSpacing: '0.1em' }}>关于 {match.name}</p>
            <div className="space-y-5">
              {match.profileHighlights.map((h, i) => (
                <div key={i} className={i > 0 ? 'pt-5 border-t' : ''} style={{ borderColor: 'var(--cream-border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{h.label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: i === 2 ? 'Noto Serif SC, serif' : 'inherit', fontStyle: i === 2 ? 'italic' : 'normal' }}>
                    {i === 2 ? `"${h.value}"` : h.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry notice */}
          {isExpired && (
            <div className="p-5 rounded-xl border flex items-start gap-3" style={{ background: 'var(--muted)', borderColor: 'var(--cream-border)' }}>
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                这封匹配信的联系窗口已关闭（7天内未操作自动过期）。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(28,26,26,0.4)' }}>
          <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--card)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--wine-light)' }}>
              <Heart size={20} style={{ color: 'var(--wine)' }} />
            </div>
            <h3 className="text-base mb-3 text-center" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
              确认联系 {match.name}？
            </h3>
            <p className="text-sm leading-relaxed mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>
              系统会向对方发送一条联系请求。<br />
              <strong>只有对方也确认后</strong>，你们才会互相看到对方的邮箱。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
              >
                再想想
              </button>
              <button
                onClick={handleContact}
                disabled={contactLoading}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                {contactLoading ? '发送中…' : '确认联系'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
