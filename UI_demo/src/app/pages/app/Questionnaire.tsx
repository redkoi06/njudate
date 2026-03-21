import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, ChevronLeft, CheckCircle, Save } from 'lucide-react';

const sections = [
  {
    id: 'self',
    title: '自我认知',
    subtitle: '关于你是谁',
    questions: [
      {
        id: 'q1',
        type: 'textarea',
        question: '用三个词形容你自己，然后各用一句话解释为什么选择这三个词。',
        placeholder: '例如：矛盾——我常常同时想要孤独和陪伴；认真——我对大多数事情都投入多于必要的精力……',
        hint: '不需要完美，真实就好。',
      },
      {
        id: 'q2',
        type: 'radio',
        question: '你如何为自己补充能量？',
        options: [
          '独处、安静的活动（读书、散步、写东西）',
          '在熟悉的朋友陪伴下轻松聊天',
          '去新的地方、做新的事情',
          '因状态而异，没有固定模式',
        ],
      },
      {
        id: 'q3',
        type: 'textarea',
        question: '有没有什么你觉得别人很少理解的、属于你自己的特质？',
        placeholder: '可以是习惯、思维方式、某种执念……不需要解释是否"正常"。',
      },
    ],
  },
  {
    id: 'lifestyle',
    title: '生活方式',
    subtitle: '关于你的日常',
    questions: [
      {
        id: 'q4',
        type: 'textarea',
        question: '描述一个对你来说"还不错"的普通周末是什么样的。',
        placeholder: '不需要是"理想"周末，只要是你真实会选择的就好……',
      },
      {
        id: 'q5',
        type: 'radio',
        question: '你与时间的关系更接近哪种？',
        options: [
          '计划型——喜欢提前安排，有秩序感会让我安心',
          '随意型——顺其自然，过多计划会让我有压力',
          '两者混合——工作/学习很有计划，私生活随意',
          '状态决定一切，我有时极有计划有时完全随机',
        ],
      },
      {
        id: 'q6',
        type: 'multi',
        question: '在关系中，你通常扮演什么角色？（可多选）',
        options: [
          '倾听者',
          '分享者',
          '照顾者',
          '被照顾者',
          '制造乐趣的人',
          '解决问题的人',
          '带来平静的人',
        ],
      },
    ],
  },
  {
    id: 'values',
    title: '价值观',
    subtitle: '关于你认为重要的事',
    questions: [
      {
        id: 'q7',
        type: 'textarea',
        question: '有没有一本书、一部电影或一段话，对你的影响比较深远？简单说说为什么。',
        placeholder: '不需要"高大上"，真实触动过你的就好。',
      },
      {
        id: 'q8',
        type: 'scale',
        question: '对你来说，"独处时间"在亲密关系中有多重要？',
        leftLabel: '可以完全不需要',
        rightLabel: '非常重要，不可或缺',
      },
      {
        id: 'q9',
        type: 'textarea',
        question: '你如何处理与亲近的人之间的意见分歧？描述一个真实的方式。',
        placeholder: '不需要是"正确"的方式，是你实际会怎么做……',
      },
    ],
  },
  {
    id: 'relationship',
    title: '关系期待',
    subtitle: '关于你想要的连接',
    questions: [
      {
        id: 'q10',
        type: 'textarea',
        question: '你对"认识一个新朋友/伴侣"这件事通常抱有什么样的节奏感？',
        placeholder: '比如：你倾向于快速进入深入交流，还是需要很长时间才能打开？',
      },
      {
        id: 'q11',
        type: 'radio',
        question: '如果用一个词描述你现在希望的连接方式，是哪个？',
        options: [
          '陪伴——有人在，不需要太多言语',
          '共鸣——能聊进去、能被理解',
          '成长——彼此激励，一起变得更好',
          '轻松——不沉重，不用解释，自在就好',
          '深刻——不求多，但要真',
        ],
      },
      {
        id: 'q12',
        type: 'textarea',
        question: '还有什么你想让对方在认识你之前就了解的？',
        placeholder: '完全可选。可以是任何事情——你的某个习惯、某种边界，或者一个小小的坦白……',
        required: false,
      },
    ],
  },
];

type Answers = Record<string, string | string[] | number>;

export function Questionnaire() {
  const { user, updateUser } = useAuth();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(user?.questionnaireComplete || false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentSection = sections[sectionIndex];
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const setAnswer = (id: string, val: string | string[] | number) => {
    setAnswers(p => ({ ...p, [id]: val }));
  };

  const toggleMulti = (id: string, option: string) => {
    const current = (answers[id] as string[]) || [];
    const next = current.includes(option) ? current.filter(c => c !== option) : [...current, option];
    setAnswer(id, next);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setLastSaved(new Date());
  };

  const handleSubmit = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    updateUser({ questionnaireComplete: true });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <div className="mb-8">
          <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>深度问卷</p>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            你的问卷
          </h1>
        </div>

        <div className="py-16 text-center rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--status-success-bg)' }}>
            <CheckCircle size={24} style={{ color: 'var(--status-success)' }} />
          </div>
          <h2 className="text-xl mb-3" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
            问卷已完成
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            谢谢你认真回答了这些问题。<br />
            你的回答会帮助我们找到真正和你有共鸣的人。
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-xs px-5 py-2.5 rounded-full border"
            style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
          >
            查看 / 修改回答
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section, si) => (
            <div key={section.id} className="p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--wine-medium)' }}>{section.title}</p>
                  <h3 className="text-sm" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>{section.subtitle}</h3>
                </div>
                <button
                  onClick={() => { setSubmitted(false); setSectionIndex(si); }}
                  className="text-xs px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
                >
                  编辑
                </button>
              </div>
              <div className="space-y-3">
                {section.questions.map(q => {
                  const ans = answers[q.id];
                  return (
                    <div key={q.id}>
                      <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{q.question}</p>
                      {ans ? (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {Array.isArray(ans) ? ans.join('、') : typeof ans === 'number' ? `${ans}/5` : ans}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>未填写</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest mb-2" style={{ color: 'var(--text-subtle)', letterSpacing: '0.15em' }}>深度问卷</p>
          <h1 style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 400 }}>
            讲述真实的你
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            大约需要 20 分钟，可以随时保存草稿，分多次完成。
          </p>
        </div>
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border transition-all"
          style={{ borderColor: 'var(--cream-border)', color: 'var(--text-secondary)' }}
        >
          <Save size={13} />
          {saving ? '保存中…' : lastSaved ? `已保存 ${lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '保存草稿'}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>已完成 {answeredCount}/{totalQuestions} 题</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cream-border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--wine)' }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
        {sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSectionIndex(i)}
            className="flex-1 py-2 rounded-lg text-xs transition-all"
            style={{
              background: i === sectionIndex ? 'var(--card)' : 'transparent',
              color: i === sectionIndex ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: i === sectionIndex ? 500 : 400,
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="p-8 rounded-xl border mb-6" style={{ background: 'var(--card)', borderColor: 'var(--cream-border)' }}>
        <div className="mb-8">
          <p className="text-xs mb-1" style={{ color: 'var(--wine-medium)' }}>{currentSection.title}</p>
          <h2 className="text-lg" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>
            {currentSection.subtitle}
          </h2>
        </div>

        <div className="space-y-10">
          {currentSection.questions.map((q, qi) => (
            <div key={q.id} className={qi > 0 ? 'pt-8 border-t' : ''} style={{ borderColor: 'var(--cream-border)' }}>
              <div className="flex items-start gap-3 mb-4">
                <span className="text-xs px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ background: 'var(--wine-light)', color: 'var(--wine)', fontFamily: 'Noto Serif SC, serif' }}>
                  {String(qi + 1 + sectionIndex * 3).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {q.question}
                    {(q as any).required === false && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-subtle)' }}>（选填）</span>}
                  </p>
                  {(q as any).hint && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(q as any).hint}</p>}
                </div>
              </div>

              {q.type === 'textarea' && (
                <textarea
                  rows={4}
                  value={(answers[q.id] as string) || ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  placeholder={(q as any).placeholder}
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none"
                  style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)', color: 'var(--text-primary)', lineHeight: 1.8 }}
                />
              )}

              {q.type === 'radio' && (
                <div className="space-y-2">
                  {q.options?.map(opt => (
                    <label key={opt} className="flex items-start gap-3 p-3.5 rounded-lg cursor-pointer transition-all" style={{
                      background: answers[q.id] === opt ? 'var(--wine-pale)' : 'var(--cream-warm)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: answers[q.id] === opt ? 'var(--wine-light)' : 'var(--cream-border)',
                    }}>
                      <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: answers[q.id] === opt ? 'var(--wine)' : 'var(--cream-border)' }}>
                        {answers[q.id] === opt && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--wine)' }} />}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{opt}</span>
                      <input type="radio" className="hidden" checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} />
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multi' && (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map(opt => {
                    const selected = ((answers[q.id] as string[]) || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleMulti(q.id, opt)}
                        className="px-4 py-2 rounded-full text-sm border transition-all"
                        style={{
                          background: selected ? 'var(--wine-light)' : 'var(--cream-warm)',
                          borderColor: selected ? 'var(--wine-medium)' : 'var(--cream-border)',
                          color: selected ? 'var(--wine)' : 'var(--text-secondary)',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'scale' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(q as any).leftLabel}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(q as any).rightLabel}</span>
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => setAnswer(q.id, val)}
                        className="flex-1 py-3 rounded-lg text-sm border transition-all"
                        style={{
                          background: answers[q.id] === val ? 'var(--wine-light)' : 'var(--cream-warm)',
                          borderColor: answers[q.id] === val ? 'var(--wine-medium)' : 'var(--cream-border)',
                          color: answers[q.id] === val ? 'var(--wine)' : 'var(--text-secondary)',
                          fontWeight: answers[q.id] === val ? 500 : 400,
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSectionIndex(p => p - 1)}
          disabled={sectionIndex === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm border transition-all"
          style={{
            borderColor: 'var(--cream-border)',
            color: sectionIndex === 0 ? 'var(--text-subtle)' : 'var(--text-secondary)',
            opacity: sectionIndex === 0 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={15} />
          上一章节
        </button>

        {sectionIndex < sections.length - 1 ? (
          <button
            onClick={() => setSectionIndex(p => p + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm transition-all"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            下一章节
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all"
            style={{ background: saving ? 'var(--wine-medium)' : 'var(--wine)', color: 'var(--cream)' }}
          >
            <CheckCircle size={15} />
            {saving ? '提交中…' : '提交问卷'}
          </button>
        )}
      </div>
    </div>
  );
}
