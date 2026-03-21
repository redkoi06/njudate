import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Edit3 } from 'lucide-react';

const departments = [
  '中文系', '哲学系', '历史系', '社会学系', '外语系', '数学系', '物理系', '化学系',
  '生物系', '计算机系', '经济系', '管理系', '法学院', '医学院', '工程学院', '艺术学院', '其他',
];

const grades = ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士生'];

export function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    department: user?.department || '',
    grade: user?.grade || '',
    bio: '喜欢在图书馆角落里读书，偶尔写一点东西。对哲学问题有些执念，觉得好的对话比好的答案更有价值。',
    interests: '阅读、写作、独立电影、长途骑行',
    publicFields: {
      department: true,
      grade: true,
      bio: true,
      interests: true,
    },
  });

  const handleSave = async () => {
    await new Promise(r => setTimeout(r, 600));
    updateUser({ name: form.name, department: form.department, grade: form.grade, profileComplete: true });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const togglePublic = (field: keyof typeof form.publicFields) => {
    setForm(p => ({ ...p, publicFields: { ...p.publicFields, [field]: !p.publicFields[field] } }));
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>我的资料</p>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            关于你
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--status-success)' }}>
              <CheckCircle size={13} />
              已保存
            </div>
          )}
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                保存
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)', background: 'transparent' }}
            >
              <Edit3 size={13} />
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left: Avatar + basic */}
        <div className="col-span-1 space-y-5">
          {/* Avatar */}
          <div className="p-6 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--wine-light)' }}>
              <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '2rem', color: 'var(--wine)', fontWeight: 300 }}>
                {user?.name?.[0] || '?'}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{user?.name}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            {user?.profileComplete && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <CheckCircle size={12} style={{ color: 'var(--status-success)' }} />
                <span className="text-xs" style={{ color: 'var(--status-success)' }}>资料已完善</span>
              </div>
            )}
          </div>

          {/* Visibility guide */}
          <div className="p-5 rounded-xl border" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>展示设置</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              以下标注"对方可见"的字段，将在匹配时部分展示给对方。<br /><br />
              你的完整问卷内容永远不会对外公开。
            </p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="col-span-2 space-y-5">
          {/* Basic info */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <h3 className="text-sm mb-5" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>基本信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>昵称</label>
                {editing ? (
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                    style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                  />
                ) : (
                  <p className="text-sm py-3" style={{ color: 'var(--text-primary)' }}>{form.name}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>院系</label>
                  {editing ? (
                    <select
                      value={form.department}
                      onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm outline-none appearance-none"
                      style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                    >
                      {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm py-3" style={{ color: 'var(--text-primary)' }}>{form.department}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>年级</label>
                  {editing ? (
                    <select
                      value={form.grade}
                      onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm outline-none appearance-none"
                      style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                    >
                      {grades.map(g => <option key={g}>{g}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm py-3" style={{ color: 'var(--text-primary)' }}>{form.grade}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>简短自我介绍</h3>
              <VisibilityToggle
                visible={form.publicFields.bio}
                onToggle={() => togglePublic('bio')}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <textarea
                rows={4}
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="用几句话描述你自己，不需要完整，真诚就好…"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
                style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
              />
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{form.bio || <span style={{ color: 'var(--text-subtle)' }}>未填写</span>}</p>
            )}
          </div>

          {/* Interests */}
          <div className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>兴趣爱好</h3>
              <VisibilityToggle
                visible={form.publicFields.interests}
                onToggle={() => togglePublic('interests')}
                disabled={!editing}
              />
            </div>
            {editing ? (
              <input
                value={form.interests}
                onChange={e => setForm(p => ({ ...p, interests: e.target.value }))}
                placeholder="用逗号分隔，例如：阅读、摄影、爬山"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none"
                style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.interests.split('、').filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--wine-light)', color: 'var(--wine)' }}>
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VisibilityToggle({ visible, onToggle, disabled }: { visible: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      className="flex items-center gap-1.5 text-xs transition-colors"
      style={{ color: visible ? 'var(--wine)' : 'var(--text-muted)', cursor: disabled ? 'default' : 'pointer' }}
    >
      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center`} style={{ borderColor: visible ? 'var(--wine)' : 'var(--cream-border)' }}>
        {visible && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--wine)' }} />}
      </div>
      {visible ? '对方可见' : '仅自己可见'}
    </button>
  );
}
