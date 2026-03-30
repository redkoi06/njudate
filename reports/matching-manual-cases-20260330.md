# 匹配算法手工案例运行手册（2026-03-30）

## 1. 目标

本手册用于通过管理后台手工创建账号和批次，验证以下能力：

- 异地约束是否生效
- 加权评分是否可解释
- Gale-Shapley 稳定匹配是否稳定且可复现
- 同分 tie-break 是否按解释强度优先

## 2. 准备

1. 启动项目

```bash
npm run dev
```

2. 准备 6 个测试账号（建议邮箱命名）

- female_a@example.com
- female_b@example.com
- female_c@example.com
- male_a@example.com
- male_b@example.com
- male_c@example.com

3. 每个账号完成基础资料和问卷：

- 资料：gender, campus, grade, birth_year
- 题目：q-single, q-multiple, q-scale, q-long-distance-acceptance

## 3. 管理后台操作

1. 用管理员账号进入 Admin 页面。
2. 创建新批次（draft），选择已发布问卷版本。
3. 设置时间满足：signup_start < signup_end < match_run < result_publish。
4. 切换批次状态到 open。
5. 让测试账号加入该批次。
6. 到时间后切换批次到 locked。
7. 执行匹配处理，等待 processing 完成。
8. 发布结果（published）。

## 4. 案例模板（建议至少跑 5 组）

### Case 1: 标准稳定匹配

- 输入：2 女 + 2 男，女 A 与男 A 高匹配，女 B 与男 B 高匹配。
- 预期：形成两对稳定匹配；无阻塞对。
- 校验：两个 matched 结果均有 preview_text、reasons、shared_signals。

### Case 2: 跨校区 + 双方 same-city-only

- 输入：女 A（xianlin, same-city-only）与男 A（gulou, same-city-only）。
- 预期：该对被硬过滤，不进入候选。
- 校验：最终不会形成该配对。

### Case 3: 同分冲突

- 输入：女 A 对男 A、男 B 总分相同，但女 A 与男 B 的 explain 强度更高。
- 预期：同分时优先选 explain 强度更高的一侧。
- 校验：匹配结果偏向男 B。

### Case 4: 最低分阈值淘汰

- 输入：两人可比较题存在，但总分低于 minimumPairScore。
- 预期：该对不入选，参与者可能 unmatched。
- 校验：对应用户结果为 unmatched。

### Case 5: groups.size != 2

- 输入：仅单一性别或出现第三组性别。
- 预期：稳定匹配入口直接返回空选对。
- 校验：全部 unmatched，且无异常。

## 5. 数据核对清单

1. match_pairs

- 左右 participation_id 成对且无重复
- 同一用户不应出现于多个 pair

2. match_results

- matched 记录包含：score, preview_text, reasons, shared_signals
- unmatched 记录包含：status=unmatched

3. 行为一致性

- 同一批次重复运行（固定输入）应得到一致结果
- 同分场景下结果稳定，不随插入顺序漂移

## 6. 自动化补充命令

```bash
npm run test -- src/lib/matching/engine.test.ts
npm run test -- src/lib/matching
npm run test:matching:ab
```

## 7. A/B 指标口径

A 组：当前策略
B 组：优化策略（解释增强 + 同分 tie-break 强化）

核心指标：

- matchRate: matchedParticipants / totalParticipants
- avgPairScore: 平均配对分
- stabilityViolations: 阻塞对数量
- explainCoverage: 含 explain 的 matched 占比

建议：每轮至少跑小样本（6-10人）与中样本（20-30人）两档。
