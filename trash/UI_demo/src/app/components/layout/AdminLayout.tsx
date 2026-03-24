import { Outlet, NavLink, useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';
import {
  BarChart3, Users, BookOpen, Shuffle, MessageCircle, LogOut, ArrowLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/admin', icon: BarChart3, label: '概览', exact: true },
  { to: '/admin/users', icon: Users, label: '用户管理' },
  { to: '/admin/questions', icon: BookOpen, label: '题库管理' },
  { to: '/admin/batches', icon: Shuffle, label: '匹配批次' },
  { to: '/admin/consult', icon: MessageCircle, label: '联系咨询' },
];

export function AdminLayout() {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !user?.isAdmin)) {
      navigate('/login');
    }
  }, [isLoggedIn, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中…</div>
      </div>
    );
  }

  if (!isLoggedIn || !user?.isAdmin) return null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 fixed top-0 left-0 h-full flex flex-col border-r" style={{ background: '#F0EBE9', borderColor: 'var(--cream-border)' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--cream-border)' }}>
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine)' }}>
              <span style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif', fontSize: '11px' }}>缘</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm tracking-widest leading-none" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.1em' }}>同频</span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>管理后台</span>
            </div>
          </Link>
        </div>

        {/* Admin Info */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--wine)' }}>
              <span className="text-sm" style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif' }}>管</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>管理员</p>
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
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all`
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
          <button
            onClick={() => navigate('/app/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} style={{ opacity: 0.7 }} />
            <span>返回用户端</span>
          </button>
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
        <div className="max-w-[1100px] mx-auto px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
