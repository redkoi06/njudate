export function About() {
  return (
    <div className="max-w-[1280px] mx-auto px-8 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-widest mb-6" style={{ color: 'var(--text-subtle)', letterSpacing: '0.2em' }}>关于我们</p>
        <h1 className="mb-10" style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.5 }}>
          同频，是一个关于<br />认真相遇的实验
        </h1>

        <div className="space-y-10">
          <section>
            <h2 className="text-base mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>我们为什么做这件事</h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>我们是一群在校学生，觉得现有的交友方式有些令人疲惫——左滑右滑、大量匹配、快速筛选，最后却感到越来越空洞。</p>
              <p>我们相信，校园里有很多认真、有趣、值得被认识的人。他们只是缺少一个合适的方式遇到彼此。</p>
              <p>所以我们做了同频：一个慢一点、认真一点的平台。每周只有一次匹配，附上详细的匹配理由，像一封信一样送到你面前。</p>
            </div>
          </section>

          <div className="border-t" style={{ borderColor: 'var(--cream-border)' }} />

          <section>
            <h2 className="text-base mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>我们的核心原则</h2>
            <div className="space-y-5">
              {[
                { title: '认真优先于速度', desc: '我们不追求匹配数量，我们追求每一次匹配的质量。宁可少一点，但每一次都值得。' },
                { title: '尊重边界', desc: '联系需要双方确认。没有对方的回应，你不会收到任何联系方式。保护每一个人的安全边界。' },
                { title: '自主决定', desc: '每周参与完全自愿。暂停、恢复、退出，都由你掌控，没有任何压力。' },
                { title: '数据克制', desc: '我们只收集必要的信息。问卷数据用于匹配，不用于商业用途，不对外分享。' },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-1 flex-shrink-0 rounded-full mt-1" style={{ background: 'var(--wine-light)', alignSelf: 'stretch' }} />
                  <div>
                    <p className="text-sm mb-1.5" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.title}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t" style={{ borderColor: 'var(--cream-border)' }} />

          <section>
            <h2 className="text-base mb-4" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-primary)', fontWeight: 400 }}>我们是谁</h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>同频由一个小团队维护，成员均为在校或刚毕业的学生，来自不同专业背景。我们做这件事不是为了商业变现，而是因为我们自己也在等待那样的相遇。</p>
              <p>平台目前处于内测阶段，仅向本校学生开放。如有问题或建议，欢迎随时联系我们。</p>
            </div>
          </section>

          <div className="p-8 rounded-xl border" style={{ background: 'var(--cream-warm)', borderColor: 'var(--cream-border)' }}>
            <p className="text-sm leading-relaxed text-center" style={{ fontFamily: 'Noto Serif SC, serif', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "以认真的心，等待认真的人。<br />
              不焦虑，不将就，不催促。"
            </p>
            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-subtle)' }}>— 同频团队</p>
          </div>
        </div>
      </div>
    </div>
  );
}
