import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export function PublicLayout() {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/about', label: '关于我们' },
    { to: '/privacy', label: '隐私承诺' },
    { to: '/contact', label: '联系我们' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'rgba(250,247,244,0.92)', backdropFilter: 'blur(12px)', borderColor: 'var(--cream-border)' }}>
        <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--wine)' }}>
              <span className="text-xs" style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif' }}>缘</span>
            </div>
            <span className="text-base tracking-widest" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.15em' }}>同频</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm transition-colors"
                style={{ color: location.pathname === link.to ? 'var(--wine)' : 'var(--text-secondary)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/app/dashboard')}
                className="px-5 py-2 text-sm rounded-full transition-all"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                进入应用
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 text-sm rounded-full transition-all border"
                style={{ borderColor: 'var(--wine)', color: 'var(--wine)', background: 'transparent' }}
              >
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: 'var(--cream-border)', background: 'var(--cream-warm)' }}>
        <div className="max-w-[1280px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--wine)' }}>
                  <span className="text-xs" style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif', fontSize: '10px' }}>缘</span>
                </div>
                <span className="text-sm tracking-widest" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.15em' }}>同频</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                一个关于认真相遇的地方。<br />
                只面向在校学生，只做真诚的连接。
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="text-xs mb-3 tracking-widest" style={{ color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>了解</p>
                <div className="flex flex-col gap-2">
                  <Link to="/about" className="text-sm" style={{ color: 'var(--text-secondary)' }}>关于我们</Link>
                  <Link to="/privacy" className="text-sm" style={{ color: 'var(--text-secondary)' }}>隐私承诺</Link>
                </div>
              </div>
              <div>
                <p className="text-xs mb-3 tracking-widest" style={{ color: 'var(--text-subtle)', letterSpacing: '0.1em' }}>联系</p>
                <div className="flex flex-col gap-2">
                  <Link to="/contact" className="text-sm" style={{ color: 'var(--text-secondary)' }}>联系我们</Link>
                  <a href="mailto:hello@campus-match.edu.cn" className="text-sm" style={{ color: 'var(--text-secondary)' }}>发送邮件</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>© 2025 同频校园匹配平台 · 仅供内部使用</p>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>以认真的心，等待认真的人</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
