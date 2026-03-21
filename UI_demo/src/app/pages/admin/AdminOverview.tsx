import { Users, Heart, Calendar, MessageCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const stats = [
  { label: '注册用户', value: 312, change: '+14', changeLabel: '本月新增', icon: Users, color: 'var(--wine)' },
  { label: '完成问卷', value: 248, change: '79%', changeLabel: '完成率', icon: Heart, color: 'var(--status-success)' },
  { label: '本周参与', value: 86, change: '+8', changeLabel: '较上周', icon: Calendar, color: 'var(--status-info)' },
  { label: '待处理咨询', value: 7, change: '', changeLabel: '需要回复', icon: MessageCircle, color: 'var(--status-warning)' },
];

const weeklyData = [
  { week: '第8周', participants: 72, matches: 36, contacts: 18 },
  { week: '第9周', participants: 68, matches: 31, contacts: 15 },
  { week: '第10周', participants: 80, matches: 40, contacts: 22 },
  { week: '第11周', participants: 78, matches: 38, contacts: 19 },
  { week: '第12周', participants: 86, matches: 42, contacts: 24 },
];

const registrationData = [
  { month: '10月', count: 28 },
  { month: '11月', count: 45 },
  { month: '12月', count: 38 },
  { month: '1月', count: 62 },
  { month: '2月', count: 55 },
  { month: '3月', count: 84 },
];

const recentUsers = [
  { name: '陈 ·', dept: '哲学系', grade: '大四', joinDate: '2025-03-20', questionnaire: true },
  { name: '沈 ·', dept: '社会学系', grade: '研二', joinDate: '2025-03-19', questionnaire: true },
  { name: '王 ·', dept: '计算机系', grade: '大三', joinDate: '2025-03-18', questionnaire: false },
  { name: '刘 ·', dept: '数学系', grade: '研一', joinDate: '2025-03-17', questionnaire: true },
  { name: '张 ·', dept: '中文系', grade: '大二', joinDate: '2025-03-16', questionnaire: false },
];

export function AdminOverview() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>管理后台</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          数据概览
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} · 第 13 周进行中
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--cream-warm)' }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              {s.change && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--status-success)' }}>
                  <TrendingUp size={11} />
                  {s.change}
                </div>
              )}
            </div>
            <p className="text-2xl mb-1" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 300 }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label} · {s.changeLabel}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Weekly participation */}
        <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>近5周数据</h3>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--wine-light)' }} />
                参与
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--wine)' }} />
                匹配
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--wine-medium)' }} />
                联系
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={12} barGap={2}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--cream-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="participants" fill="var(--wine-light)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="matches" fill="var(--wine)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="contacts" fill="var(--wine-medium)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Registration trend */}
        <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <h3 className="text-sm mb-6" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>注册趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={registrationData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--card)', border: '1px solid var(--cream-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--wine)"
                strokeWidth={2}
                dot={{ fill: 'var(--wine)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent users */}
      <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>最近注册用户</h3>
          <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--wine)' }}>
            查看全部 <ArrowUpRight size={12} />
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr>
              {['昵称', '院系', '年级', '注册时间', '问卷状态'].map(h => (
                <th key={h} className="text-left pb-3 text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--cream-border)' }}>
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--wine-light)' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)' }}>{u.name[0]}</span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                  </div>
                </td>
                <td className="py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.dept}</td>
                <td className="py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.grade}</td>
                <td className="py-3.5 text-xs" style={{ color: 'var(--text-muted)' }}>{u.joinDate}</td>
                <td className="py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{
                    background: u.questionnaire ? 'var(--status-success-bg)' : 'var(--muted)',
                    color: u.questionnaire ? 'var(--status-success)' : 'var(--text-muted)',
                  }}>
                    {u.questionnaire ? '已完成' : '未完成'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
