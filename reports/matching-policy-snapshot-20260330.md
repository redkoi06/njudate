# 当前匹配策略快照（2026-03-30）

## 批次信息
- 批次 code: batch-202614
- 批次 label: 当前匹配批次
- 状态: published
- round_no: 1
- signup_start_at: 2026-03-29 00:02:45.84959 +0800
- signup_end_at: 2026-04-01 00:02:45.84959 +0800
- match_run_at: 2026-04-01 20:00:00 +0800
- result_publish_at: 2026-04-01 20:01:00 +0800
- processed_at: 2026-03-30 15:12:05.937034 +0800
- published_at: 2026-03-30 15:12:26.591437 +0800

## matching_policy_snapshot_json（结构化解读）
- minimumPairScore: 60
- profileFilters:
  - field=gender, mode=opposite_required
- profileScoring:
  - field=grade, mode=same_bonus, weight=0.6
  - field=department, mode=same_bonus, weight=0.4
  - field=campus, mode=same_bonus, weight=0.2
  - field=birth_year, mode=distance_penalty, maxGap=4, weight=0.5
- questionScoring:
  - singleDefaultWeight=1
  - multipleDefaultWeight=1.2
  - scaleDefaultWeight=1.5
  - minimumComparableQuestions=6

## 结果统计（当前库内）
- matched: 4
- unmatched: 2

## 用户级结果样本
- female_a@smail.nju.edu.cn: matched, score=92
- female_b@smail.nju.edu.cn: matched, score=88
- male_a@smail.nju.edu.cn: matched, score=92
- male_b@smail.nju.edu.cn: matched, score=88
- female_c@smail.nju.edu.cn: unmatched
- male_c@smail.nju.edu.cn: unmatched

## 说明
- 本快照来自数据库字段 match_batches.matching_policy_snapshot_json，不是测试默认值推断。
- 若需要做 A/B 评估，请使用同一批输入分别运行旧策略和新策略，并对比匹配率、均分、稳定性违规数、解释覆盖率。
- 可重复执行的查询模板见 reports/sql/export_matching_policy_snapshot.sql。
