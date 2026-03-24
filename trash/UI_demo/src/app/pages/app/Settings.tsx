import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import { CheckCircle, AlertTriangle, Bell, Shield, Trash2, LogOut } from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [notifs, setNotifs] = useState({
    matchResult: true,
    contactRequest: true,
    weeklyReminder: false,
    newsletter: false,
  });
  const [privacy, setPrivacy] = useState({
    showDept: true,
    showGrade: true,
    allowContact: true,
  });

  const handleSave = async () => {
    await new Promise(r => setTimeout(r, 500));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>设置</p>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            账户设置
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--status-success)' }}>
              <CheckCircle size={13} />
              已保存
            </div>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-sm"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            保存设置
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <section className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <h2 className="text-sm mb-5" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>账户信息</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>注册邮箱</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>已验证</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>账户状态</p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>正常</p>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>加入于 2025年1月</span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Bell size={15} style={{ color: 'var(--wine-medium)' }} />
            <h2 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>通知设置</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'matchResult', label: '匹配结果通知', desc: '每周五匹配结果发布时发送邮件' },
              { key: 'contactRequest', label: '联系请求通知', desc: '当有人想联系你时发送邮件' },
              { key: 'weeklyReminder', label: '每周参与提醒', desc: '周一提醒你是否参与本周匹配（可选）' },
              { key: 'newsletter', label: '平台更新通知', desc: '功能更新和重要公告（频率很低）' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--cream-border)' }}>
                <div>
                  <p className="text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                  className="w-10 h-5.5 rounded-full relative transition-all flex-shrink-0"
                  style={{
                    background: notifs[item.key as keyof typeof notifs] ? 'var(--wine)' : 'var(--cream-border)',
                    width: 40,
                    height: 22,
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4.5 h-4.5 rounded-full transition-all"
                    style={{
                      width: 18,
                      height: 18,
                      top: 2,
                      left: notifs[item.key as keyof typeof notifs] ? 20 : 2,
                      background: 'white',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Shield size={15} style={{ color: 'var(--wine-medium)' }} />
            <h2 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>隐私设置</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'showDept', label: '展示院系', desc: '匹配时展示你的院系信息' },
              { key: 'showGrade', label: '展示年级', desc: '匹配时展示你的年级信息' },
              { key: 'allowContact', label: '允许联系请求', desc: '关闭后，匹配结果不会包含联系选项' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: 'var(--cream-border)' }}>
                <div>
                  <p className="text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacy(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                  className="rounded-full relative transition-all flex-shrink-0"
                  style={{
                    background: privacy[item.key as keyof typeof privacy] ? 'var(--wine)' : 'var(--cream-border)',
                    width: 40,
                    height: 22,
                  }}
                >
                  <div
                    className="absolute rounded-full transition-all"
                    style={{
                      width: 18,
                      height: 18,
                      top: 2,
                      left: privacy[item.key as keyof typeof privacy] ? 20 : 2,
                      background: 'white',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pause participation */}
        <section className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <h2 className="text-sm mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>暂停参与</h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            如果你暂时不想参与匹配，可以在这里暂停。暂停期间你的资料不会进入任何匹配池，但账户保留。随时可以恢复。
          </p>
          <button
            className="text-sm px-5 py-2.5 rounded-lg border transition-all"
            style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
          >
            暂停账户
          </button>
        </section>

        {/* Danger zone */}
        <section className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'rgba(192,64,64,0.2)' }}>
          <h2 className="text-sm mb-2" style={{ color: '#C04040', fontWeight: 500 }}>危险操作</h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
            删除账户将永久移除你的所有数据，包括问卷回答和匹配记录，无法恢复。
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg border"
              style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
            >
              <LogOut size={14} />
              退出登录
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg border"
              style={{ borderColor: 'rgba(192,64,64,0.4)', color: '#C04040' }}
            >
              <Trash2 size={14} />
              删除账户
            </button>
          </div>
        </section>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(28,26,26,0.4)' }}>
          <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--card)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#FEF2F2' }}>
              <AlertTriangle size={20} style={{ color: '#C04040' }} />
            </div>
            <h3 className="text-base mb-2 text-center" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              确认删除账户？
            </h3>
            <p className="text-sm leading-relaxed mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>
              此操作不可撤销。所有数据将在7个工作日内彻底删除。
            </p>
            <div className="mb-4">
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                输入「确认删除」以继续
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="确认删除"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                disabled={deleteConfirmText !== '确认删除'}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: deleteConfirmText === '确认删除' ? '#C04040' : 'var(--muted)',
                  color: deleteConfirmText === '确认删除' ? 'white' : 'var(--text-subtle)',
                }}
              >
                删除账户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
