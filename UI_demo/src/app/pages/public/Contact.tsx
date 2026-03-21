import { useState } from 'react';
import { Mail, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const subjects = [
    '账户问题',
    '匹配相关疑问',
    '隐私数据请求',
    '功能建议',
    '举报问题',
    '其他',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-[1280px] mx-auto px-8 py-20">
        <div className="max-w-md mx-auto text-center py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--status-success-bg)' }}>
            <CheckCircle size={24} style={{ color: 'var(--status-success)' }} />
          </div>
          <h2 className="text-xl mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
            已收到你的留言
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            我们通常在3个工作日内回复。<br />
            请留意你的邮箱（包括垃圾邮件文件夹）。
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm underline"
            style={{ color: 'var(--text-muted)' }}
          >
            再发一条
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-widest mb-6" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>联系我们</p>
        <h1 className="mb-4" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.5 }}>
          有什么想说的？
        </h1>
        <p className="text-sm mb-12 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          无论是问题、建议还是任何想法，我们都认真对待每一封信。
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Mail size={15} style={{ color: 'var(--wine)' }} />
                <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>邮件</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>hello@campus-match.edu.cn</p>
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <MessageSquare size={15} style={{ color: 'var(--wine)' }} />
                <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>回复时间</p>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>工作日 3 天内回复</p>
            </div>
            <div className="p-4 rounded-xl border" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
              <div className="flex gap-2.5">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--wine-medium)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  紧急安全问题请直接发邮件，不要通过此表单，我们会优先处理。
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>你的昵称</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="可以是任何称呼"
                    className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                    style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>回复邮箱</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="用于接收回复"
                    className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all"
                    style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>问题类型</label>
                <select
                  required
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none appearance-none"
                  style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: form.subject ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  <option value="" disabled>请选择</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>内容</label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="请详细描述你的问题或建议…"
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
                  style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-sm transition-all"
                style={{ background: loading ? 'var(--wine-medium)' : 'var(--wine)', color: 'var(--cream)' }}
              >
                {loading ? '发送中…' : '发送留言'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
