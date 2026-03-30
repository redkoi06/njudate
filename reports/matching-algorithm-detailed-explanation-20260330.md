# 匹配算法详细说明与题目扩展适配指南（2026-03-30）

## 1. 算法目标

当前匹配算法的设计目标不是“只看总分找最高分”，而是同时满足三件事：

- 可用性：候选双方在硬约束上不冲突
- 稳定性：最终结果尽量避免“阻塞对”
- 可解释性：每个配对结果都能给出理由和共同信号

整体流程可概括为：

1. 生成候选对（两两组合）
2. 硬约束过滤
3. 计算加权兼容分
4. 依据分数与解释信息排序
5. 在二元分组上做 Gale-Shapley 稳定匹配
6. 输出 matched/unmatched 与解释字段

## 2. 输入数据结构

算法核心输入分为三类：

- 参与者：基础资料 + 问卷答案
- 题目定义：题型、选项、权重、量表边界
- 策略配置：阈值、资料评分规则、题型默认权重

对应实现可在以下文件查看：

- src/lib/matching/engine.ts
- src/lib/matching/policy.ts
- src/lib/matching/lifecycle-core.ts

## 3. 硬约束过滤（先过滤再打分）

### 3.1 性别约束

当前策略要求“异性匹配”，若同组或资料缺失则直接淘汰。

### 3.2 跨校区与异地接受度约束

当双方校区不同，且双方都选择 same-city-only 时，直接硬过滤。

这一点保证了算法不会把明显不可接受的组合推进到后续阶段。

## 4. 评分机制

总分采用“资料评分 + 问题评分”的加权平均。

设总权重为 $W$，总加权得分为 $S$，则最终分数为：

$$
\text{score} = \mathrm{round}\left(\frac{S}{W} \times 100\right)
$$

并受两个阈值约束：

- minimumComparableQuestions：最少可比较题数
- minimumPairScore：最低可接受匹配分

如果未达到任一阈值，则该候选对被淘汰。

### 4.1 资料评分

当前支持：

- same_bonus：字段相同得 1，否则 0（如 grade、department、campus）
- distance_penalty：按差距线性扣分（当前用于 birth_year）

年龄差评分形式：

$$
\text{score}_{age} = \max\left(0, 1 - \frac{|y_1-y_2|}{\text{maxGap}}\right)
$$

### 4.2 题目评分

#### single

答案一致得 1，否则 0。

#### multiple

使用集合重叠比例（Jaccard）：

$$
\text{score}_{multi} = \frac{|A \cap B|}{|A \cup B|}
$$

#### scale

按量表距离线性衰减：

$$
\text{score}_{scale} = 1 - \frac{|a-b|}{\text{max}-\text{min}}
$$

### 4.3 特殊题逻辑

当前对两类题做了专门逻辑：

- q-age-preference
- q-long-distance-acceptance

它们不完全走通用题型评分，而是按业务语义计算兼容度。

## 5. 可解释输出

每个候选对会生成：

- previewText：一句话摘要
- reasons：最多 5 条高贡献理由（不足 3 条会补回退文案）
- sharedSignals：提炼后的共同信号
- explain：结构化解释（分数分解、tie-break 元信息、贡献项）

理由排序优先级为：

1. 单项 score 更高
2. weightedContribution 更高
3. 文案字典序（保证确定性）

## 6. 稳定匹配（Gale-Shapley）

### 6.1 二元分组前提

只有分组数恰好为 2 时才执行稳定匹配，否则直接返回空结果。

### 6.2 提议方与接收方

两组中人数较少的一组作为 proposer，另一组作为 receiver。

### 6.3 偏好排序

每个参与者偏好列表排序依据：

1. score
2. comparableCount
3. explain.tieBreak.strengthScore
4. explain.tieBreak.signalCount
5. 对方 participationId 字典序

这样做的目的：

- 保持稳定性
- 同分时尽可能保留可解释性更强的组合
- 结果可复现

## 7. 复杂度与工程特性

设参与人数为 $n$，可比较题数为 $m$：

- 候选生成与打分约为 $O(n^2 \cdot m)$
- 稳定匹配阶段在候选偏好表上执行，复杂度近似 $O(P)$ 到 $O(P^2)$（取决于可行边密度）

工程上当前做法是“先离线批处理再发布结果”，适合周批次/轮次型业务。

## 8. 新增选择题时能否很好适配

结论：能，且适配成本较低；但分为“无业务语义变化”和“有业务语义变化”两类。

### 8.1 无业务语义变化（最常见）

例如新增一个普通 single 或 multiple 题，用于偏好补充。

通常只需：

1. 在问卷版本中新增题目（带 question_code、kind、weight）
2. 确保用户答案写入 submissions
3. 在批次锁定后让参与者都提交

算法会自动按题型参与打分，不需要改 engine 核心代码。

### 8.2 有业务语义变化（需要扩展）

例如题目代表硬约束或非线性偏好（类似异地接受度、年龄偏好）。

建议做法：

1. 在 compareSpecialQuestion 中增加对应 question_code 的专门比较逻辑
2. 必要时在硬过滤阶段增加预判逻辑
3. 为该特殊题补单测（正向、反向、边界）

## 9. 新增选择题后的参数调优建议

新增题目后，最常见风险不是“算不出来”，而是“门槛不合理”。建议同步检查：

1. minimumComparableQuestions
- 题目增多后，门槛可能过高，导致候选被过度淘汰。

2. 题目 weight 分布
- 若某一新题权重过大，会主导总分，压制其他维度。

3. minimumPairScore
- 当题库扩展后，得分分布会变化，需重新标定阈值。

## 10. 验证新增题是否适配良好的最小方案

1. 单元测试
- single 一致/不一致
- multiple 交并比边界
- scale 极值与中间值
- special 题（如有）

2. 小样本批次回放
- 6 到 10 人构造数据，验证 matched/unmatched 分布是否符合预期

3. A/B 指标对比
- matchRate
- avgPairScore
- stabilityViolations
- explainCoverage

当新增题后，若稳定性不退化、解释覆盖不下降、匹配率变化在可接受范围内，则可认为适配良好。

## 11. 实操建议

如果你准备继续加选择题，推荐先走这条路径：

1. 先加普通题（不改 engine），观察一轮
2. 再加特殊语义题（按 question_code 扩展 compareSpecialQuestion）
3. 每次改动都跑一次小样本 A/B

这样可以在不打断现有生产链路的前提下，逐步增强策略表达能力。
