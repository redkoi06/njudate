import { useState } from 'react';
import { Calendar, Clock, CheckCircle, Info, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';

const weekHistory = [
  { week: 12, label: '第 12 周', dateRange: '3月17日 - 3月23日', participated: true, matched: true, matchName: '陈 ·', status: 'completed' },
  { week: 11, label: '第 11 周', dateRange: '3月10日 - 3月16日', participated: true, matched: true, matchName: '沈 ·', status: 'completed' },
  { week: 10, label: '第 10 周', dateRange: '3月3日 - 3月9日', participated: false, matched: false, matchName: null, status: 'skipped' },
  { week: 9, label: '第 9 周', dateRange: '2月24日 - 3月2日', participated: true, matched: false, matchName: null, status: 'no_match' },
  { week: 8, label: '第 8 周', dateRange: '2月17日 - 2月23日', participated: true, matched: true, matchName: '许 ·', status: 'completed' },
];

export function WeeklyParticipation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isParticipating, setIsParticipating] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'join' | 'leave' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Deadline: Thursday 23:59
  const deadline = '本周四 23:59';
  const matchTime = '本周五 20:00';
  const currentWeek = 13;
  const currentDateRange = '3月24日 - 3月30日';

  const canParticipate = user?.questionnaireComplete;

  const handleToggle = (action: 'join' | 'leave') => {
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsParticipating(confirmAction === 'join');
    setLoading(false);
    setShowConfirm(false);
    setConfirmAction(null);
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>本周参与</p>
        <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
          第 {currentWeek} 周匹配
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{currentDateRange}</p>
      </div>

      {/* Main participation card */}
      {!canParticipate ? (
        <div className="p-8 rounded-xl border mb-6" style={{ background: 'var(--status-warning-bg)', borderColor: 'rgba(160,122,58,0.2)' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(160,122,58,0.15)' }}>
              <AlertCircle size={18} style={{ color: 'var(--status-warning)' }} />
            </div>
            <div>
              <p className="text-sm mb-1.5" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>需要先完成深度问卷</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                参与匹配前，需要完成深度问卷，这是我们进行匹配的核心依据。问卷大约需要 20 分钟，可以分多次完成。
              </p>
              <button
                onClick={() => navigate('/app/questionnaire')}
                className="text-sm px-5 py-2.5 rounded-lg"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                前往填写问卷
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-8 rounded-xl border mb-6 transition-all`} style={{
          background: isParticipating ? 'var(--wine-pale)' : 'var(--card)',
          borderColor: isParticipating ? 'var(--wine-light)' : 'var(--cream-border)',
        }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isParticipating ? 'var(--wine-light)' : 'var(--muted)' }}>
                {isParticipating ? (
                  <CheckCircle size={22} style={{ color: 'var(--wine)' }} />
                ) : (
                  <Calendar size={22} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div>
                <p className="text-base mb-1" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {isParticipating ? '你已参与本周匹配' : '本周暂未参与'}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {isParticipating
                    ? '你的资料已进入本周匹配池。周五晚八点，你将收到匹配结果。'
                    : '你可以在本周四 23:59 前加入本周匹配。'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(isParticipating ? 'leave' : 'join')}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: isParticipating ? 'transparent' : 'var(--wine)',
                color: isParticipating ? 'var(--wine)' : 'var(--cream)',
                borderWidth: isParticipating ? 1 : 0,
                borderStyle: 'solid',
                borderColor: 'var(--wine-medium)',
              }}
            >
              {isParticipating ? '退出本周' : '加入本周'}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} style={{ color: 'var(--wine-medium)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>报名截止</p>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{deadline}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>还有约 4 天</p>
        </div>
        <div className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={14} style={{ color: 'var(--wine-medium)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>匹配结果发布</p>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{matchTime}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>还有约 7 天</p>
        </div>
      </div>

      {/* How it works */}
      <div className="p-6 rounded-xl border mb-8" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
        <div className="flex items-start gap-3">
          <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--wine-medium)' }} />
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>关于本周参与</p>
            <div className="space-y-1.5">
              {[
                '每周一至周四可以加入或退出本周匹配，截止时间为周四 23:59。',
                '每周五晚八点，系统会向参与者发送匹配结果。',
                '本周不参与不影响下周。你可以随时暂停，随时恢复。',
                '每次匹配为一对一，附有详细的匹配理由。',
                '收到匹配结果后，如果你想联系对方，需要点击"联系 TA"，对方也确认后才会互相公开邮箱。',
              ].map((item, i) => (
                <p key={i} className="text-sm leading-relaxed flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full inline-block" style={{ background: 'var(--wine-medium)' }} />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 w-full text-left mb-4"
        >
          <h2 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>历史参与记录</h2>
          <ChevronDown size={14} className="transition-transform" style={{ color: 'var(--text-muted)', transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        {showHistory && (
          <div className="space-y-2">
            {weekHistory.map(w => (
              <div key={w.week} className="flex items-center justify-between p-4 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    background: w.participated ? 'var(--wine-light)' : 'var(--muted)',
                  }}>
                    {w.participated ? (
                      <CheckCircle size={14} style={{ color: 'var(--wine)' }} />
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{w.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.dateRange}</p>
                  </div>
                </div>
                <div className="text-right">
                  {!w.participated ? (
                    <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>未参与</span>
                  ) : w.matched ? (
                    <div>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
                        已匹配 {w.matchName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--muted)', color: 'var(--text-muted)' }}>
                      本周无匹配
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(28,26,26,0.4)' }}>
          <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--card)' }}>
            <h3 className="text-base mb-3" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
              {confirmAction === 'join' ? '确认加入本周匹配？' : '确认退出本周匹配？'}
            </h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
              {confirmAction === 'join'
                ? '加入后，你将参与本周五的匹配。可以在截止时间（周四 23:59）前随时退出。'
                : '退出后，你将不参与本周五的匹配。这不影响你下周的参与资格。'
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                {loading ? '处理中…' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
