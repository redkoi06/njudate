import { useState } from 'react';
import { Search, Filter, Eye, Ban, MoreHorizontal, X, CheckCircle } from 'lucide-react';

const mockUsers = [
  { id: 'u001', name: '林知晚', email: 'linzw@campus.edu.cn', dept: '中文系', grade: '大三', joinDate: '2025-01-15', questionnaire: true, participations: 8, status: 'active' },
  { id: 'u002', name: '陈 ·', email: 'ch***@campus.edu.cn', dept: '哲学系', grade: '大四', joinDate: '2025-01-20', questionnaire: true, participations: 10, status: 'active' },
  { id: 'u003', name: '沈 ·', email: 'sh***@campus.edu.cn', dept: '社会学系', grade: '研二', joinDate: '2025-02-01', questionnaire: true, participations: 7, status: 'active' },
  { id: 'u004', name: '王 ·', email: 'wa***@campus.edu.cn', dept: '计算机系', grade: '大三', joinDate: '2025-02-10', questionnaire: false, participations: 0, status: 'active' },
  { id: 'u005', name: '刘 ·', email: 'li***@campus.edu.cn', dept: '数学系', grade: '研一', joinDate: '2025-02-15', questionnaire: true, participations: 5, status: 'suspended' },
  { id: 'u006', name: '张 ·', email: 'zh***@campus.edu.cn', dept: '中文系', grade: '大二', joinDate: '2025-02-20', questionnaire: false, participations: 0, status: 'active' },
  { id: 'u007', name: '许 ·', email: 'xu***@campus.edu.cn', dept: '历史系', grade: '大四', joinDate: '2025-01-25', questionnaire: true, participations: 9, status: 'active' },
  { id: 'u008', name: '方 ·', email: 'fa***@campus.edu.cn', dept: '外语系', grade: '研一', joinDate: '2025-03-01', questionnaire: true, participations: 4, status: 'active' },
];

export function UserManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [questionnaireFilter, setQuestionnaireFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = mockUsers.filter(u => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (questionnaireFilter === 'done' && !u.questionnaire) return false;
    if (questionnaireFilter === 'pending' && u.questionnaire) return false;
    if (search && !u.name.includes(search) && !u.dept.includes(search) && !u.email.includes(search)) return false;
    return true;
  });

  const statusConfig = {
    active: { label: '正常', color: 'var(--status-success)', bg: 'var(--status-success-bg)' },
    suspended: { label: '已暂停', color: 'var(--text-muted)', bg: 'var(--muted)' },
    banned: { label: '已封禁', color: '#C04040', bg: '#FEF2F2' },
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>管理后台</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          用户管理
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>共 {mockUsers.length} 名用户</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名、院系、邮箱…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {[{ v: 'all', l: '全部状态' }, { v: 'active', l: '正常' }, { v: 'suspended', l: '已暂停' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: statusFilter === f.v ? 'var(--card)' : 'transparent', color: statusFilter === f.v ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: statusFilter === f.v ? 500 : 400 }}>
              {f.l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {[{ v: 'all', l: '全部' }, { v: 'done', l: '已完成问卷' }, { v: 'pending', l: '未完成' }].map(f => (
            <button key={f.v} onClick={() => setQuestionnaireFilter(f.v)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: questionnaireFilter === f.v ? 'var(--card)' : 'transparent', color: questionnaireFilter === f.v ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: questionnaireFilter === f.v ? 500 : 400 }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
        <table className="w-full">
          <thead style={{ background: 'var(--cream-warm)' }}>
            <tr>
              {['昵称', '院系 / 年级', '注册时间', '参与次数', '问卷', '状态', ''].map((h, i) => (
                <th key={i} className="text-left px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const st = statusConfig[u.status as keyof typeof statusConfig];
              return (
                <tr key={u.id} className="border-t hover:bg-[var(--cream-warm)] transition-colors" style={{ borderColor: 'var(--cream-border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine-light)' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'Noto Serif SC, serif', color: 'var(--wine)' }}>{u.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.dept} · {u.grade}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-muted)' }}>{u.joinDate}</td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>{u.participations}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{
                      background: u.questionnaire ? 'var(--status-success-bg)' : 'var(--muted)',
                      color: u.questionnaire ? 'var(--status-success)' : 'var(--text-muted)',
                    }}>
                      {u.questionnaire ? '已完成' : '未完成'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedUser(u); setShowDetail(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--cream-warm)]"
                      >
                        <Eye size={13} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--cream-warm)]">
                        <MoreHorizontal size={13} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>没有符合条件的用户</p>
          </div>
        )}
      </div>

      {/* User detail modal */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-end z-50" style={{ background: 'rgba(28,26,26,0.3)' }}>
          <div className="h-full w-96 overflow-y-auto border-l" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
              <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>用户详情</h3>
              <button onClick={() => setShowDetail(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cream-warm)' }}>
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--wine-light)' }}>
                  <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--wine)' }}>{selectedUser.name[0]}</span>
                </div>
                <p className="text-base" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)' }}>{selectedUser.name}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{selectedUser.email}</p>
              </div>

              {[
                { label: '院系', value: selectedUser.dept },
                { label: '年级', value: selectedUser.grade },
                { label: '注册时间', value: selectedUser.joinDate },
                { label: '参与次数', value: `${selectedUser.participations} 次` },
                { label: '问卷状态', value: selectedUser.questionnaire ? '已完成' : '未完成' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              ))}

              <div className="space-y-2 pt-2">
                <button className="w-full py-2.5 rounded-xl text-sm border flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}>
                  <Ban size={13} />
                  暂停账户
                </button>
                <button className="w-full py-2.5 rounded-xl text-sm border flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={13} />
                  发送通知邮件
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
