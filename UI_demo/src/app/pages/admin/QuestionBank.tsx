import { useState } from 'react';
import { Plus, Edit3, Trash2, GripVertical, ChevronDown, X, Save } from 'lucide-react';

const mockQuestions = [
  { id: 'q1', section: 'self', order: 1, type: 'textarea', question: '用三个词形容你自己，然后各用一句话解释为什么选择这三个词。', status: 'active', responses: 248 },
  { id: 'q2', section: 'self', order: 2, type: 'radio', question: '你如何为自己补充能量？', status: 'active', responses: 247 },
  { id: 'q3', section: 'self', order: 3, type: 'textarea', question: '有没有什么你觉得别人很少理解的、属于你自己的特质？', status: 'active', responses: 244 },
  { id: 'q4', section: 'lifestyle', order: 1, type: 'textarea', question: '描述一个对你来说"还不错"的普通周末是什么样的。', status: 'active', responses: 246 },
  { id: 'q5', section: 'lifestyle', order: 2, type: 'radio', question: '你与时间的关系更接近哪种？', status: 'active', responses: 245 },
  { id: 'q6', section: 'lifestyle', order: 3, type: 'multi', question: '在关系中，你通常扮演什么角色？（可多选）', status: 'active', responses: 243 },
  { id: 'q7', section: 'values', order: 1, type: 'textarea', question: '有没有一本书、一部电影或一段话，对你的影响比较深远？', status: 'active', responses: 242 },
  { id: 'q8', section: 'values', order: 2, type: 'scale', question: '对你来说，"独处时间"在亲密关系中有多重要？', status: 'active', responses: 241 },
  { id: 'q9', section: 'values', order: 3, type: 'textarea', question: '你如何处理与亲近的人之间的意见分歧？', status: 'active', responses: 240 },
  { id: 'q10', section: 'relationship', order: 1, type: 'textarea', question: '你对"认识一个新朋友/伴侣"这件事通常抱有什么样的节奏感？', status: 'active', responses: 239 },
  { id: 'q11', section: 'relationship', order: 2, type: 'radio', question: '如果用一个词描述你现在希望的连接方式，是哪个？', status: 'active', responses: 238 },
  { id: 'q12', section: 'relationship', order: 3, type: 'textarea', question: '还有什么你想让对方在认识你之前就了解的？', status: 'draft', responses: 0 },
];

const sectionLabels: Record<string, string> = {
  self: '自我认知',
  lifestyle: '生活方式',
  values: '价值观',
  relationship: '关系期待',
};

const typeLabels: Record<string, string> = {
  textarea: '文本',
  radio: '单选',
  multi: '多选',
  scale: '量表',
};

export function QuestionBank() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editQuestion, setEditQuestion] = useState<typeof mockQuestions[0] | null>(null);
  const [newQuestion, setNewQuestion] = useState({ section: 'self', type: 'textarea', question: '', status: 'draft' });

  const sections = ['self', 'lifestyle', 'values', 'relationship'];

  const groupedQuestions = sections.reduce((acc, s) => {
    acc[s] = mockQuestions.filter(q => q.section === s);
    return acc;
  }, {} as Record<string, typeof mockQuestions>);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>管理后台</p>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            题库管理
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>共 {mockQuestions.length} 道题目</p>
        </div>
        <button
          onClick={() => { setEditQuestion(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--wine)', color: 'var(--cream)' }}
        >
          <Plus size={14} />
          添加题目
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {sections.map(s => (
          <div key={s} className="p-5 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--wine-medium)' }}>{sectionLabels[s]}</p>
            <p className="text-xl" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 300 }}>
              {groupedQuestions[s]?.length || 0}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>道题目</p>
          </div>
        ))}
      </div>

      {/* Questions by section */}
      <div className="space-y-4">
        {sections.map(s => (
          <div key={s} className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <button
              onClick={() => setActiveSection(activeSection === s ? null : s)}
              className="w-full flex items-center justify-between px-6 py-4"
              style={{ background: 'var(--cream-warm)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{sectionLabels[s]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--wine-light)', color: 'var(--wine)' }}>
                  {groupedQuestions[s]?.length} 题
                </span>
              </div>
              <ChevronDown
                size={15}
                style={{ color: 'var(--text-muted)', transform: activeSection === s ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              />
            </button>

            {(activeSection === s || activeSection === null) && (
              <div className="divide-y" style={{ borderColor: 'var(--cream-border)' }}>
                {groupedQuestions[s]?.map(q => (
                  <div key={q.id} className="px-6 py-4 flex items-start gap-4 group">
                    <GripVertical size={14} className="mt-0.5 flex-shrink-0 opacity-30 group-hover:opacity-60" style={{ color: 'var(--text-muted)', cursor: 'grab' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--muted)', color: 'var(--text-muted)' }}>
                          {typeLabels[q.type]}
                        </span>
                        {q.status === 'draft' && (
                          <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}>
                            草稿
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                      <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{q.responses} 人已回答</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditQuestion(q); setShowEditor(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--cream-warm)' }}
                      >
                        <Edit3 size={12} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--cream-warm)' }}
                      >
                        <Trash2 size={12} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editor Drawer */}
      {showEditor && (
        <div className="fixed inset-0 flex items-center justify-end z-50" style={{ background: 'rgba(28,26,26,0.3)' }}>
          <div className="h-full w-[480px] overflow-y-auto border-l" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
            <div className="p-6 border-b flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
              <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
                {editQuestion ? '编辑题目' : '添加题目'}
              </h3>
              <button onClick={() => setShowEditor(false)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--cream-warm)' }}>
                <X size={13} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>所属章节</label>
                <select
                  defaultValue={editQuestion?.section || 'self'}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none"
                  style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                >
                  {sections.map(s => <option key={s} value={s}>{sectionLabels[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>题目类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <button key={k} className="py-2.5 rounded-xl text-xs border transition-all"
                      style={{
                        background: (editQuestion?.type || 'textarea') === k ? 'var(--wine-light)' : 'var(--cream-warm)',
                        borderColor: (editQuestion?.type || 'textarea') === k ? 'var(--wine-medium)' : 'var(--cream-border)',
                        color: (editQuestion?.type || 'textarea') === k ? 'var(--wine)' : 'var(--text-secondary)',
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>题目内容</label>
                <textarea
                  rows={4}
                  defaultValue={editQuestion?.question || ''}
                  placeholder="输入题目内容…"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                  style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)', lineHeight: 1.8 }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>提示文字（可选）</label>
                <input
                  placeholder="输入框占位符或补充说明…"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>发布状态</label>
                <div className="flex gap-2">
                  {[{ v: 'active', l: '立即发布' }, { v: 'draft', l: '保存草稿' }].map(s => (
                    <button key={s.v} className="flex-1 py-2.5 rounded-xl text-sm border"
                      style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ background: 'var(--wine)', color: 'var(--cream)' }}
              >
                <Save size={14} />
                保存题目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
