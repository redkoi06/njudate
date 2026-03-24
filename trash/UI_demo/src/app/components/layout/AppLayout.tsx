import { Outlet, NavLink, useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import {
  LayoutDashboard, User, FileText, Calendar, Heart, Settings, LogOut, ChevronRight, Shield
} from 'lucide-react';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: '主页' },
  { to: '/app/participation', icon: Calendar, label: '本周参与' },
  { to: '/app/matches', icon: Heart, label: '匹配记录' },
  { to: '/app/questionnaire', icon: FileText, label: '深度问卷' },
  { to: '/app/profile', icon: User, label: '我的资料' },
  { to: '/app/settings', icon: Settings, label: '设置' },
];

export function AppLayout() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 fixed top-0 left-0 h-full flex flex-col border-r" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--cream-border)' }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine)' }}>
              <span style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif', fontSize: '11px' }}>缘</span>
            </div>
            <span className="text-sm tracking-widest" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.15em' }}>同频</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine-light)' }}>
              <span className="text-sm" style={{ color: 'var(--wine)', fontFamily: 'Noto Serif SC, serif' }}>
                {user?.name?.[0] || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.department} · {user?.grade}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                    isActive
                      ? 'font-medium'
                      : ''
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? 'var(--wine-light)' : 'transparent',
                  color: isActive ? 'var(--wine)' : 'var(--text-secondary)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'var(--cream-border)' }}>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Shield size={16} style={{ opacity: 0.7 }} />
              <span>管理后台</span>
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={16} style={{ opacity: 0.7 }} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-[960px] mx-auto px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
