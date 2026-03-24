import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Heart, FileText, ArrowRight, Clock, CheckCircle } from 'lucide-react';

const recentMatches = [
  {
    id: 'm001',
    week: '第 12 周',
    date: '2025年3月21日',
    name: '陈 ·',
    dept: '哲学系 · 大四',
    status: 'contacted',
    preview: '你们都提到了对「独处」有相似的理解，同时对未来抱有开放但不焦虑的态度……',
  },
  {
    id: 'm002',
    week: '第 11 周',
    date: '2025年3月14日',
    name: '沈 ·',
    dept: '社会学系 · 研二',
    status: 'read',
    preview: '在关于「意义」的问题上，你们给出了截然不同但互相补足的答案……',
  },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  contacted: { label: '已联系', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  read: { label: '已读取', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  waiting: { label: '等待中', color: 'var(--text-muted)', bg: 'var(--muted)' },
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock participation status
  const isParticipatingThisWeek = true;
  const nextMatchDate = '3月28日（本周五）晚 8:00';

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '深夜好';
    if (hour < 11) return '早上好';
    if (hour < 14) return '午安';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  return (
    <div>
      {/* Greeting */}
      <div className="mb-10">
        <p className="text-xs tracking-widest mb-3" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.75rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          {greeting()}，{user?.name}
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          {isParticipatingThisWeek
            ? '你已参与本周匹配，等待周五的匹配结果。'
            : '你尚未参与本周匹配，本周四前可以参加。'
          }
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {/* This week status */}
        <div
          className="col-span-1 p-6 rounded-xl border cursor-pointer transition-all group"
          style={{ background: isParticipatingThisWeek ? 'var(--wine-pale)' : 'var(--card)', borderColor: isParticipatingThisWeek ? 'var(--wine-light)' : 'var(--cream-border)' }}
          onClick={() => navigate('/app/participation')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isParticipatingThisWeek ? 'var(--wine-light)' : 'var(--muted)' }}>
              <Calendar size={15} style={{ color: isParticipatingThisWeek ? 'var(--wine)' : 'var(--text-muted)' }} />
            </div>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>本周参与</p>
          <p className="text-sm" style={{ color: isParticipatingThisWeek ? 'var(--wine)' : 'var(--text-primary)', fontWeight: 500 }}>
            {isParticipatingThisWeek ? '已报名' : '未参与'}
          </p>
        </div>

        {/* Next match */}
        <div
          className="col-span-2 p-6 rounded-xl border cursor-pointer transition-all group"
          style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}
          onClick={() => navigate('/app/participation')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--wine-light)' }}>
              <Clock size={15} style={{ color: 'var(--wine)' }} />
            </div>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>下次匹配时间</p>
          <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{nextMatchDate}</p>
          {isParticipatingThisWeek && (
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle size={12} style={{ color: 'var(--status-success)' }} />
              <span className="text-xs" style={{ color: 'var(--status-success)' }}>已加入本周匹配池</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile completion */}
      {(!user?.profileComplete || !user?.questionnaireComplete) && (
        <div className="p-6 rounded-xl border mb-8" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(160,122,58,0.2)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm mb-1.5" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>完善资料，才能参与匹配</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {!user?.questionnaireComplete ? '你还没有完成深度问卷，完成后才能加入匹配池。' : '请完成资料填写。'}
              </p>
            </div>
            <button
              onClick={() => navigate(user?.questionnaireComplete ? '/app/profile' : '/app/questionnaire')}
              className="text-xs px-4 py-2 rounded-full flex-shrink-0 ml-4"
              style={{ background: 'var(--wine)', color: 'var(--cream)' }}
            >
              {user?.questionnaireComplete ? '完善资料' : '开始问卷'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Matches */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>近期匹配</h2>
        <button
          onClick={() => navigate('/app/matches')}
          className="text-xs flex items-center gap-1 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          查看全部 <ArrowRight size={12} />
        </button>
      </div>

      {recentMatches.length === 0 ? (
        <div className="py-16 text-center rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--muted)' }}>
            <Heart size={18} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>还没有匹配记录</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>参与本周匹配，周五收到你的第一封匹配信</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentMatches.map(match => {
            const st = statusMap[match.status] || statusMap.waiting;
            return (
              <div
                key={match.id}
                className="p-6 rounded-xl border cursor-pointer transition-all group"
                style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}
                onClick={() => navigate(`/app/matches/${match.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine-light)' }}>
                      <span className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)' }}>
                        {match.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{match.name}</p>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.dept}</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-subtle)' }}>{match.week} · {match.date}</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{match.preview}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-10 pt-8 border-t grid grid-cols-3 gap-4" style={{ borderColor: 'var(--cream-border)' }}>
        {[
          { icon: FileText, label: '查看问卷', to: '/app/questionnaire', desc: '你的深度问卷' },
          { icon: Heart, label: '匹配记录', to: '/app/matches', desc: '所有匹配历史' },
          { icon: Calendar, label: '本周参与', to: '/app/participation', desc: '管理参与状态' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.to)}
            className="p-5 rounded-xl border text-left transition-all group"
            style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}
          >
            <item.icon size={16} className="mb-3" style={{ color: 'var(--wine-medium)' }} />
            <p className="text-sm mb-0.5" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
