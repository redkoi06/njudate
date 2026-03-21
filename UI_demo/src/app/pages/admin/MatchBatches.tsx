import { useState } from 'react';
import { Play, Eye, Download, CheckCircle, Clock, AlertCircle, X, Users, Heart, Shuffle } from 'lucide-react';

const batches = [
  {
    id: 'b013',
    week: 13,
    label: '第 13 周',
    dateRange: '3月24日 - 3月30日',
    deadline: '2025-03-27 23:59',
    matchTime: '2025-03-28 20:00',
    participants: 86,
    matches: null,
    status: 'open',
  },
  {
    id: 'b012',
    week: 12,
    label: '第 12 周',
    dateRange: '3月17日 - 3月23日',
    deadline: '2025-03-20 23:59',
    matchTime: '2025-03-21 20:00',
    participants: 82,
    matches: 38,
    contacts: 24,
    status: 'completed',
  },
  {
    id: 'b011',
    week: 11,
    label: '第 11 周',
    dateRange: '3月10日 - 3月16日',
    deadline: '2025-03-13 23:59',
    matchTime: '2025-03-14 20:00',
    participants: 78,
    matches: 36,
    contacts: 19,
    status: 'completed',
  },
  {
    id: 'b010',
    week: 10,
    label: '第 10 周',
    dateRange: '3月3日 - 3月9日',
    deadline: '2025-03-06 23:59',
    matchTime: '2025-03-07 20:00',
    participants: 70,
    matches: 33,
    contacts: 16,
    status: 'completed',
  },
  {
    id: 'b009',
    week: 9,
    label: '第 9 周',
    dateRange: '2月24日 - 3月2日',
    deadline: '2025-02-27 23:59',
    matchTime: '2025-02-28 20:00',
    participants: 68,
    matches: 31,
    contacts: 15,
    status: 'completed',
  },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: '报名中', color: 'var(--status-info)', bg: 'var(--status-info-bg)', icon: Clock },
  processing: { label: '匹配中', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)', icon: Shuffle },
  completed: { label: '已完成', color: 'var(--status-success)', bg: 'var(--status-success-bg)', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'var(--text-muted)', bg: 'var(--muted)', icon: AlertCircle },
};

export function MatchBatches() {
  const [selectedBatch, setSelectedBatch] = useState<typeof batches[0] | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [runBatch, setRunBatch] = useState<typeof batches[0] | null>(null);
  const [running, setRunning] = useState(false);
  const [runComplete, setRunComplete] = useState(false);

  const handleRunMatch = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setRunning(false);
    setRunComplete(true);
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>管理后台</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          匹配批次
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>管理每周匹配批次的运行和查看匹配结果</p>
      </div>

      {/* Current batch highlight */}
      <div className="p-7 rounded-xl border mb-8" style={{ background: 'var(--wine-pale)', borderColor: 'var(--wine-light)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
                报名中
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>第 13 周 · 3月24日 - 3月30日</span>
            </div>
            <h2 className="text-lg mb-1" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
              当前批次
            </h2>
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: 'var(--wine-medium)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>86</strong> 人已报名
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: 'var(--wine-medium)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>截止 <strong style={{ color: 'var(--text-primary)' }}>3月27日 23:59</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setRunBatch(batches[0]); setShowRunModal(true); setRunComplete(false); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            <Shuffle size={14} />
            运行匹配
          </button>
        </div>
      </div>

      {/* Batches table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
        <table className="w-full">
          <thead style={{ background: 'var(--cream-warm)' }}>
            <tr>
              {['批次', '时间范围', '报名人数', '匹配对数', '联系数', '状态', ''].map((h, i) => (
                <th key={i} className="text-left px-5 py-3.5 text-xs" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.map(batch => {
              const st = statusConfig[batch.status];
              const StIcon = st.icon;
              return (
                <tr key={batch.id} className="border-t hover:bg-[var(--cream-warm)] transition-colors" style={{ borderColor: 'var(--cream-border)' }}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{batch.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{batch.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{batch.dateRange}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{batch.participants}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {batch.matches !== null ? (
                      <div className="flex items-center gap-1.5">
                        <Heart size={12} style={{ color: 'var(--wine-medium)' }} />
                        {batch.matches}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {(batch as any).contacts !== undefined ? (batch as any).contacts : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <StIcon size={12} style={{ color: st.color }} />
                      <span className="text-xs" style={{ color: st.color }}>{st.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {batch.status === 'completed' && (
                        <>
                          <button
                            onClick={() => setSelectedBatch(batch)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--cream-warm)' }}
                          >
                            <Eye size={12} style={{ color: 'var(--text-muted)' }} />
                          </button>
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--cream-warm)' }}
                          >
                            <Download size={12} style={{ color: 'var(--text-muted)' }} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Run Match Modal */}
      {showRunModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(28,26,26,0.4)' }}>
          <div className="w-full max-w-md p-8 rounded-2xl" style={{ background: 'var(--card)' }}>
            {!running && !runComplete ? (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--wine-light)' }}>
                  <Shuffle size={20} style={{ color: 'var(--wine)' }} />
                </div>
                <h3 className="text-base mb-3 text-center" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
                  运行第 13 周匹配？
                </h3>
                <p className="text-sm leading-relaxed mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                  将对本周 <strong>86</strong> 名参与者进行匹配，结果将在运行后立即发送至用户邮箱。
                </p>
                <div className="p-4 rounded-xl mb-6 border" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(160,122,58,0.2)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--status-warning)' }}>
                    ⚠️ 此操作不可撤销。运行前请确认报名截止时间已到（3月27日 23:59），避免有用户未能参与。
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRunModal(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}>
                    取消
                  </button>
                  <button onClick={handleRunMatch} className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
                    <Play size={13} />
                    确认运行
                  </button>
                </div>
              </>
            ) : running ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse" style={{ background: 'var(--wine-light)' }}>
                  <Shuffle size={20} style={{ color: 'var(--wine)' }} />
                </div>
                <p className="text-base mb-2" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
                  匹配运行中…
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>正在计算 86 名参与者的匹配结果，请稍候</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--status-success-bg)' }}>
                  <CheckCircle size={20} style={{ color: 'var(--status-success)' }} />
                </div>
                <h3 className="text-base mb-3 text-center" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
                  匹配完成
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[{ label: '参与人数', value: 86 }, { label: '成功匹配', value: 42 }, { label: '未匹配', value: 2 }].map(s => (
                    <div key={s.label} className="p-3 rounded-xl text-center border" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
                      <p className="text-xl" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 300 }}>{s.value}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-center mb-5" style={{ color: 'var(--text-secondary)' }}>
                  匹配结果已发送至所有参与者邮箱。
                </p>
                <button onClick={() => { setShowRunModal(false); setRunComplete(false); }} className="w-full py-2.5 rounded-xl text-sm" style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
                  关闭
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedBatch && (
        <div className="fixed inset-0 flex items-center justify-end z-50" style={{ background: 'rgba(28,26,26,0.3)' }}>
          <div className="h-full w-96 overflow-y-auto border-l" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
              <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{selectedBatch.label} 详情</h3>
              <button onClick={() => setSelectedBatch(null)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cream-warm)' }}>
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: '时间范围', value: selectedBatch.dateRange },
                { label: '报名截止', value: selectedBatch.deadline },
                { label: '匹配时间', value: selectedBatch.matchTime },
                { label: '参与人数', value: `${selectedBatch.participants} 人` },
                { label: '匹配对数', value: selectedBatch.matches !== null ? `${selectedBatch.matches} 对` : '—' },
                { label: '联系数', value: (selectedBatch as any).contacts !== undefined ? `${(selectedBatch as any).contacts} 次` : '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-3 border-b" style={{ borderColor: 'var(--cream-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              ))}
              <button className="w-full py-2.5 rounded-xl text-sm border flex items-center justify-center gap-2 mt-4" style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}>
                <Download size={13} />
                导出匹配数据
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
