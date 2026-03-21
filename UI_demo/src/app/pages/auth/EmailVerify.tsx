import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export function EmailVerify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || 'your@campus.edu.cn';
  const isDemo = location.state?.demo;

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { setCanResend(true); clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Demo mode: auto-fill with 123456
  useEffect(() => {
    if (isDemo) {
      setCode(['1', '2', '3', '4', '5', '6']);
    }
  }, [isDemo]);

  const handleInput = (i: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    setError('');
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (next.every(c => c !== '')) handleVerify(next.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (codeStr: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    // Demo: accept 123456, or any 6-digit code
    if (codeStr === '123456' || codeStr.length === 6) {
      login(email);
      navigate('/app/dashboard');
    } else {
      setError('验证码不正确，请重试');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCooldown(60);
    setResendCount(c => c + 1);
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { setCanResend(true); clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm px-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm mb-10 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} />
          返回
        </Link>

        <div className="mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ background: 'var(--wine-light)' }}>
            <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.25rem', color: 'var(--wine)' }}>信</span>
          </div>
          <h1 className="mb-2" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            验证你的邮箱
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            我们向 <span style={{ color: 'var(--text-primary)' }}>{email}</span> 发送了一封包含6位验证码的邮件。
          </p>
          {isDemo && (
            <p className="text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: 'var(--wine-light)', color: 'var(--wine)' }}>
              演示模式：验证码为 123456
            </p>
          )}
        </div>

        {/* Code inputs */}
        <div className="flex gap-3 mb-5">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center rounded-xl border text-lg outline-none transition-all"
              style={{
                background: 'var(--card)',
                borderColor: error ? '#C04040' : digit ? 'var(--wine)' : 'var(--cream-border)',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs mb-4" style={{ color: '#C04040' }}>{error}</p>
        )}

        <button
          onClick={() => handleVerify(code.join(''))}
          disabled={loading || code.some(c => !c)}
          className="w-full py-3.5 rounded-xl text-sm transition-all mb-5"
          style={{
            background: loading || code.some(c => !c) ? 'var(--wine-medium)' : 'var(--wine)',
            color: 'var(--cream)',
            opacity: code.some(c => !c) ? 0.5 : 1,
          }}
        >
          {loading ? '验证中…' : '确认登录'}
        </button>

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={!canResend}
            className="inline-flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: canResend ? 'var(--wine)' : 'var(--text-muted)' }}
          >
            <RefreshCw size={12} />
            {canResend ? '重新发送验证码' : `${cooldown} 秒后可重新发送`}
          </button>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-subtle)' }}>
          请检查垃圾邮件文件夹
        </p>
      </div>
    </div>
  );
}
