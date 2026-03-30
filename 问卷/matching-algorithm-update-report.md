# 匹配算法改造测试报告（2026-03-30）

## 1. 变更目标

本次在项目内直接完成两项算法改造：

- 在候选边打分后，配对阶段由贪心改为 `Gale-Shapley` 稳定匹配。
- 保持“异地约束 + 加权打分”规则，避免“跨校区且双方不接受异地仍因同选项高分”的问题。

## 2. 实际代码变更

### 2.1 配对策略改造

- 文件：`src/lib/matching/engine.ts`
- 变更：
	- 删除 `selectGreedyPairs`
	- 新增 `selectStablePairs`
	- 实现逻辑：
		1. 按性别分为提案方和接收方（小组作为提案方）
		2. 使用候选边 `score`（再按 `comparableCount` 和 ID）构建偏好序
		3. 运行稳定匹配迭代，输出无阻塞对

### 2.2 生产调用切换

- 文件：`src/lib/matching/lifecycle-core.ts`
- 变更：批次处理阶段由 `selectGreedyPairs(pairCandidates)` 切换为 `selectStablePairs(pairCandidates)`。

### 2.3 测试改造与新增

- 文件：`src/lib/matching/engine.test.ts`
- 变更：
	- 引用更新为 `selectStablePairs`
	- 保留并通过现有关键场景（含异地约束）
	- 新增稳定匹配用例：`builds stable pairs under weighted preference ordering`

## 3. 测试执行与结果

### 3.1 匹配模块回归测试

执行命令：

`npm run test -- src/lib/matching`

结果：

- `Test Files: 4 passed`
- `Tests: 22 passed`
- 覆盖文件：
	- `src/lib/matching/engine.test.ts`
	- `src/lib/matching/batch-runner.test.ts`
	- `src/lib/matching/notification-copy.test.ts`
	- `src/lib/matching/notification-copy-latest.test.ts`

### 3.2 重点单测结果

执行命令：

`npm run test -- src/lib/matching/engine.test.ts`

结果：

- `12 passed`
- 其中新增稳定匹配用例通过。

### 3.3 类型检查结果

执行命令：

`npm run typecheck`

结果：

- 未通过。
- 报错共 6 个，均为既有静态资源声明问题（`icon/icon.png` 模块解析失败），与本次匹配算法改造无关。

## 4. 算法效果分析

1. **约束正确性**
	 - 跨校区且双方 `same-city-only` 的候选对会被过滤，不会进入稳定匹配。
	 - 消除了“同选项=高分”在异地场景的误判。

2. **匹配稳定性**
	 - 从“全局分数优先的贪心”切换为“双方偏好一致性的稳定匹配”，降低阻塞对出现概率。
	 - 在多人候选图中，更符合长期匹配体验（减少“彼此更想选对方却未配到”的情况）。

3. **实现复杂度与改动范围**
	 - 变更集中在 `engine.ts` 与单个调用点 `lifecycle-core.ts`。
	 - 无数据库结构改动，无 migration 需求，符合最小可交付修改。

## 5. 结论

本次改造已在项目内落地，匹配模块测试全部通过，稳定匹配流程已接入批次执行主链路。

当前可上线结论：

- 匹配算法满足“异地硬约束 + 加权评分 + 稳定匹配”设计目标。
- 若后续需要，可在保持稳定性的前提下继续调优题目权重和阈值。
