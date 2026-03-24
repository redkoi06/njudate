import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart, Filter, Search, ArrowRight } from 'lucide-react';

const allMatches = [
  {
    id: 'm001',
    week: 12,
    weekLabel: '第 12 周',
    date: '2025年3月21日',
    name: '陈 ·',
    dept: '哲学系',
    grade: '大四',
    status: 'contacted',
    matchScore: 87,
    preview: '你们都提到了对「独处」有相似的理解，同时对未来抱有开放但不焦虑的态度。在关于「意义」的问题上，你们的思路也有深度的共鸣……',
    tags: ['独处', '价值观共鸣', '未来态度'],
  },
  {
    id: 'm002',
    week: 11,
    weekLabel: '第 11 周',
    date: '2025年3月14日',
    name: '沈 ·',
    dept: '社会学系',
    grade: '研二',
    status: 'read',
    matchScore: 82,
    preview: '在关于「意义」的问题上，你们给出了截然不同但互相补足的答案。TA 对孤独的理解和你有着微妙的呼应……',
    tags: ['互补', '深度交流', '孤独观'],
  },
  {
    id: 'm003',
    week: 9,
    weekLabel: '第 9 周',
    date: '2025年2月28日',
    name: '林 ·',
    dept: '中文系',
    grade: '大三',
    status: 'expired',
    matchScore: 79,
    preview: '你们对"好的对话"的定义几乎一致——不需要结论，只需要真诚的在场……',
    tags: ['对话观', '文学兴趣', '内敛'],
  },
  {
    id: 'm004',
    week: 8,
    weekLabel: '第 8 周',
    date: '2025年2月21日',
    name: '许 ·',
    dept: '历史系',
    grade: '大四',
    status: 'contacted',
    matchScore: 91,
    preview: '这是一次难得的高匹配。你们在关于时间感、日常习惯和关系期待上都有高度的契合……',
    tags: ['高度契合', '生活方式', '关系观'],
  },
  {
    id: 'm005',
    week: 6,
    weekLabel: '第 6 周',
    date: '2025年2月7日',
    name: '方 ·',
    dept: '外语系',
    grade: '研一',
    status: 'read',
    matchScore: 74,
    preview: '你们都喜欢独立电影，且对"轻松但有深度"的关系有相似的向往……',
    tags: ['共同兴趣', '关系期待', '电影'],
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  contacted: { label: '已联系', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
  read: { label: '已读取', color: 'var(--status-info)', bg: 'var(--status-info-bg)' },
  unread: { label: '未读取', color: 'var(--wine)', bg: 'var(--wine-light)' },
  expired: { label: '已过期', color: 'var(--text-muted)', bg: 'var(--muted)' },
};

export function MatchRecords() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filters = [
    { id: 'all', label: '全部' },
    { id: 'contacted', label: '已联系' },
    { id: 'read', label: '已读取' },
    { id: 'expired', label: '已过期' },
  ];

  const filtered = allMatches.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (search && !m.name.includes(search) && !m.dept.includes(search) && !m.weekLabel.includes(search)) return false;
    return true;
  });

  const stats = {
    total: allMatches.length,
    contacted: allMatches.filter(m => m.status === 'contacted').length,
    avgScore: Math.round(allMatches.reduce((a, m) => a + m.matchScore, 0) / allMatches.length),
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>匹配记录</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          所有匹配
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '总匹配次数', value: stats.total },
          { label: '已联系', value: stats.contacted },
          { label: '平均匹配度', value: `${stats.avgScore}%` },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-2xl mb-1" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 300 }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索院系、周次…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          <Filter size={12} className="ml-2" style={{ color: 'var(--text-muted)' }} />
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: filter === f.id ? 'var(--card)' : 'transparent',
                color: filter === f.id ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: filter === f.id ? 500 : 400,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--muted)' }}>
            <Heart size={18} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <p className="text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {search ? `没有找到"${search}"相关的匹配记录` : '没有匹配记录'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>参与本周匹配，周五收到你的第一封匹配信</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(match => {
            const st = statusConfig[match.status] || statusConfig.read;
            return (
              <div
                key={match.id}
                className="p-6 rounded-xl border cursor-pointer transition-all group hover:border-[var(--wine-medium)]"
                style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}
                onClick={() => navigate(`/app/matches/${match.id}`)}
              >
                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine-light)' }}>
                    <span className="text-base" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)' }}>
                      {match.name[0]}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                          <span className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{match.name}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.dept} · {match.grade}</span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{match.weekLabel} · {match.date}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-base" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)', fontWeight: 300 }}>{match.matchScore}%</p>
                          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>匹配度</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{match.preview}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {match.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--cream-warm)', color: 'var(--text-muted)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
