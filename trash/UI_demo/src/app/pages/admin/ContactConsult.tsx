import { useState } from 'react';
import { Search, MessageCircle, CheckCircle, Clock, AlertCircle, Send, X } from 'lucide-react';

const consultations = [
  {
    id: 'c001',
    from: 'us***@campus.edu.cn',
    subject: '账户问题',
    message: '我昨天注册了账户，但发现没有收到验证邮件，不知道是否注册成功了？我的邮箱是学校邮箱，不知道是否因为这个原因？',
    date: '2025-03-20 14:32',
    status: 'pending',
    priority: 'normal',
  },
  {
    id: 'c002',
    from: 'zh***@campus.edu.cn',
    subject: '匹配相关疑问',
    message: '我已经参与了三周但都没有收到匹配结果，是因为参与人数不足无法匹配，还是有什么其他问题？',
    date: '2025-03-19 20:11',
    status: 'pending',
    priority: 'normal',
  },
  {
    id: 'c003',
    from: 'wa***@campus.edu.cn',
    subject: '隐私数据请求',
    message: '我想导出我在平台上的所有数据，包括我填写的问卷内容和匹配记录，请问这个怎么操作？',
    date: '2025-03-18 10:05',
    status: 'replied',
    priority: 'normal',
    reply: '你好，你可以在"设置"→"账户信息"页面找到数据导出入口。如果遇到任何问题，请随时联系我们。',
    replyDate: '2025-03-18 14:30',
  },
  {
    id: 'c004',
    from: 'li***@campus.edu.cn',
    subject: '举报问题',
    message: '我想举报一个用户，对方在我们开始联系后表现得让我感到不舒服，TA 知道了我的邮箱但我希望这次联系终止。',
    date: '2025-03-17 22:00',
    status: 'resolved',
    priority: 'urgent',
    reply: '你好，感谢你的举报。我们已经处理了相关情况，并采取了相应措施。如果你有任何后续顾虑，请随时联系我们。你的安全是我们的首要考虑。',
    replyDate: '2025-03-17 22:45',
  },
  {
    id: 'c005',
    from: 'ch***@campus.edu.cn',
    subject: '功能建议',
    message: '建议增加一个"暂停期间的归档"功能，让我在暂停参与的时候还能看到历史匹配记录，目前暂停后感觉这部分访问不了了。',
    date: '2025-03-15 16:40',
    status: 'replied',
    priority: 'normal',
    reply: '感谢你的建议！这是个很好的功能需求，我们已经记录并加入了待开发清单。预计下一个版本迭代中会包含这个功能。',
    replyDate: '2025-03-16 10:00',
  },
  {
    id: 'c006',
    from: 'fa***@campus.edu.cn',
    subject: '账户问题',
    message: '我需要修改我的注册邮箱，因为我换了学校邮箱格式，原来的邮箱已经收不到邮件了。',
    date: '2025-03-14 09:15',
    status: 'pending',
    priority: 'normal',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: '待回复', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', icon: Clock },
  replied: { label: '已回复', color: 'var(--status-info)', bg: 'var(--status-info-bg)', icon: MessageCircle },
  resolved: { label: '已解决', color: 'var(--status-success)', bg: 'var(--status-success-bg)', icon: CheckCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  normal: { label: '普通', color: 'var(--text-muted)' },
  urgent: { label: '紧急', color: '#C04040' },
};

export function ContactConsult() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConsult, setSelectedConsult] = useState<typeof consultations[0] | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = consultations.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.subject.includes(search) && !c.message.includes(search) && !c.from.includes(search)) return false;
    return true;
  });

  const pendingCount = consultations.filter(c => c.status === 'pending').length;

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setReplyText('');
    setSelectedConsult(null);
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>管理后台</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          联系咨询
        </h1>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <AlertCircle size={14} style={{ color: 'var(--status-warning)' }} />
            <p className="text-sm" style={{ color: 'var(--status-warning)' }}>
              {pendingCount} 条留言待回复
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '全部', count: consultations.length, color: 'var(--text-primary)' },
          { label: '待回复', count: consultations.filter(c => c.status === 'pending').length, color: 'var(--status-warning)' },
          { label: '已解决', count: consultations.filter(c => c.status === 'resolved').length, color: 'var(--status-success)' },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-xl border text-center" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-2xl mb-1" style={{ fontFamily: 'Noto Serif SC, serif', color: s.color, fontWeight: 300 }}>{s.count}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索留言内容…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--card)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {[{ v: 'all', l: '全部' }, { v: 'pending', l: '待回复' }, { v: 'replied', l: '已回复' }, { v: 'resolved', l: '已解决' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: statusFilter === f.v ? 'var(--card)' : 'transparent', color: statusFilter === f.v ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: statusFilter === f.v ? 500 : 400 }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(c => {
          const st = statusConfig[c.status];
          const pr = priorityConfig[c.priority];
          const StIcon = st.icon;
          return (
            <div
              key={c.id}
              className="p-5 rounded-xl border cursor-pointer transition-all group"
              style={{ background: 'var(--card)', borderColor: c.status === 'pending' ? 'rgba(160,122,58,0.3)' : 'var(--cream-border)' }}
              onClick={() => setSelectedConsult(c)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.subject}</span>
                  {c.priority === 'urgent' && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#C04040' }}>紧急</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <div className="flex items-center gap-1.5">
                    <StIcon size={12} style={{ color: st.color }} />
                    <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                {c.message.length > 100 ? c.message.slice(0, 100) + '…' : c.message}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.from}</span>
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>·</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedConsult && (
        <div className="fixed inset-0 flex items-center justify-end z-50" style={{ background: 'rgba(28,26,26,0.3)' }}>
          <div className="h-full w-[520px] flex flex-col border-l" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="p-6 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--cream-border)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{selectedConsult.subject}</h3>
                  {selectedConsult.priority === 'urgent' && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#C04040' }}>紧急</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedConsult.from} · {selectedConsult.date}</p>
              </div>
              <button onClick={() => setSelectedConsult(null)} className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cream-warm)' }}>
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Original message */}
              <div className="p-5 rounded-xl border" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>用户留言</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedConsult.message}</p>
              </div>

              {/* Previous reply */}
              {selectedConsult.reply && (
                <div className="p-5 rounded-xl border" style={{ background: 'var(--status-success-bg)', borderColor: 'rgba(90,138,110,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={13} style={{ color: 'var(--status-success)' }} />
                    <p className="text-xs" style={{ color: 'var(--status-success)' }}>已回复 · {selectedConsult.replyDate}</p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedConsult.reply}</p>
                </div>
              )}
            </div>

            {/* Reply box */}
            {selectedConsult.status !== 'resolved' && (
              <div className="p-6 border-t flex-shrink-0" style={{ borderColor: 'var(--cream-border)' }}>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {selectedConsult.status === 'pending' ? '回复此留言' : '追加回复'}
                </p>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="输入回复内容…"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none mb-3"
                  style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)', lineHeight: 1.8 }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                    style={{
                      background: !replyText.trim() ? 'var(--muted)' : 'var(--wine)',
                      color: !replyText.trim() ? 'var(--text-muted)' : 'var(--cream)',
                    }}
                  >
                    <Send size={13} />
                    {sending ? '发送中…' : '发送回复'}
                  </button>
                  <button
                    className="px-4 py-2.5 rounded-xl text-sm border"
                    style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
                  >
                    标记已解决
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
