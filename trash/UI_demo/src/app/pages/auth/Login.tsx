import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Info } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();

  const isValidEmail = (e: string) => {
    return e.endsWith('.edu.cn') || e.endsWith('.edu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('请使用学校邮箱（以 .edu.cn 或 .edu 结尾）');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);

    navigate('/verify', { state: { email } });
  };

  const handleAdminDemo = () => {
    loginAsAdmin();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-12 border-r" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--wine)' }}>
            <span style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif', fontSize: '11px' }}>缘</span>
          </div>
          <span className="text-sm tracking-widest" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.15em' }}>同频</span>
        </Link>

        <div>
          <p className="text-2xl mb-6 leading-relaxed" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 300 }}>
            "等待一封<br />关于你的信。"
          </p>
          <div className="space-y-4">
            {[
              '仅限学校邮箱注册',
              '每周一次，不催促',
              '完整的匹配理由',
              '联系需双方确认',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--wine-medium)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>© 2025 同频校园匹配平台</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--wine)' }}>
              <span style={{ color: 'var(--cream)', fontFamily: 'Noto Serif SC, serif', fontSize: '11px' }}>缘</span>
            </div>
            <span className="text-sm tracking-widest" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', letterSpacing: '0.15em' }}>同频</span>
          </Link>

          <h1 className="mb-2" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            登录 / 注册
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            使用学校邮箱，首次登录自动创建账户
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-2.5" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>学校邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="yourname@campus.edu.cn"
                className="w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all"
                style={{
                  background: 'var(--card)',
                  borderColor: error ? '#C04040' : 'var(--cream-border)',
                  color: 'var(--text-primary)',
                }}
              />
              {error && (
                <p className="text-xs mt-2" style={{ color: '#C04040' }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading || !email ? 'var(--wine-medium)' : 'var(--wine)',
                color: 'var(--cream)',
                opacity: !email ? 0.5 : 1,
              }}
            >
              {loading ? '发送中…' : (
                <>
                  发送验证码
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 p-4 rounded-xl border flex gap-3" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--wine-medium)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              我们将向你的邮箱发送一个6位验证码，用于身份确认。验证码10分钟内有效。
            </p>
          </div>

          {/* Demo shortcuts */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--cream-border)' }}>
            <p className="text-xs text-center mb-4" style={{ color: 'var(--text-subtle)' }}>演示快捷入口</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/verify', { state: { email: 'demo@campus.edu.cn', demo: true } })}
                className="w-full py-2.5 rounded-xl text-xs border transition-all"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                以普通用户进入演示
              </button>
              <button
                onClick={handleAdminDemo}
                className="w-full py-2.5 rounded-xl text-xs border transition-all"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)', background: 'transparent' }}
              >
                以管理员身份进入演示
              </button>
            </div>
          </div>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            登录即表示同意我们的{' '}
            <Link to="/privacy" className="underline" style={{ color: 'var(--wine-medium)' }}>隐私承诺</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
