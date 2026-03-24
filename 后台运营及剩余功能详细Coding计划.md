# 后台运营及剩余功能详细 Coding 计划

## 1. 目标

这份计划的目标不是做一个“补丁式后台”，而是在现有仓库基础上，把后台运营和仍未完成或实现不完整的部分补齐到可以持续运营的状态。

本计划固定遵循以下原则：

- 继续使用现有技术栈：Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui、Supabase、Zod、Vercel。
- 所有中文文件、中文文案、SQL migration、JSON 模板一律使用 UTF-8 编码。
- 不读取 `trash/`。
- 不做双系统，不做第二套登录方案，不做站外匹配计算。
- 不在旧实现上叠兼容层；如果现有半成品和最终方案冲突，直接删掉旧路径，保留唯一正确实现。
- 不对当前数据库结构做兼容性保留；只要现有表结构、字段、约束不符合最终方案，就直接改表并收敛到唯一正确 schema。
- 后台与用户站内继续复用现有 `site-ui`、色板、卡片、按钮、排版节奏，不另起一套视觉语言。

## 2. 当前代码基线

结合当前仓库，下面这些基础已经存在：

- 用户登录、注册、邮箱确认、站内 session 流程已经存在。
- 用户基本资料、问卷填写、每周参与、匹配记录、设置页已经存在。
- 问卷底层 schema 已经存在：`questionnaire_versions`、`questionnaire_sections`、`questionnaire_questions`、`questionnaire_submissions`。
- 批次和结果底层 schema 已经存在：`match_batches`、`batch_participations`、`match_pairs`、`match_results`。
- 问卷 draft / submit RPC 已经存在：`save_questionnaire_draft`、`submit_questionnaire`。
- 匹配批次跑批骨架已经存在：`src/lib/matching/batch-runner.ts`。
- 定时入口已经存在：`src/app/api/internal/batch-runner/route.ts`。
- 管理员角色字段和 RLS 基础已经存在：`app_users.role`、`public.is_admin()`、多张表 admin policy。
- 公告、通知、操作日志表已经存在：`announcements`、`notifications`、`operation_logs`。
- `service_requests` 相关旧逻辑仍在仓库和 schema 中，但本轮不再继续扩展，后续实现应直接删除这套工单链路；`/contact` 仅保留为静态联系方式看板。

- 注：工单、`export_data`、`create_service_request` RPC、相关设置页申请入口都不是目标功能，编码时应彻底删除此项有关的残余代码、文案、入口与数据库字段。

当前仍然缺失或不完整的部分：

- 没有真正可用的后台页面，也没有 `/admin` 路由体系。
- 没有管理员登录后的角色分流，管理员仍走普通用户站内逻辑。
- 没有问卷版本运营界面，无法导入 JSON、预览 draft、发布新版本。
- 没有批次管理界面，无法创建批次、绑定问卷版本、按唯一轮次节奏手动锁定/跑批/发布。
- 没有公告后台、平台配置后台。
- 现有跑批逻辑没有完整的后台人工干预入口，也没有完整失败处置面板。
- 问卷版本更新后的用户提示还不够明确，虽然路由守卫逻辑已经能基于“当前已发布版本”判断完成状态，但缺少完整的运营闭环。
- 现有匹配算法逻辑已经在服务端，但“后台如何手动触发、如何复跑、如何观察运行结果”还没做成运营可用界面。
- 现有匹配算法仍是代码内硬编码比较逻辑，尚未形成“固定通用匹配引擎 + 版本化匹配规则配置 + 批次冻结快照”的完整设计。

## 3. 固定方案结论

### 3.1 管理员入口怎么做

采用同一套登录页、同一套 Supabase Auth、同一套用户表，不新增“开发者专用密码登录”。

真正决定去哪里的条件不是“输入了某个特殊账号”，而是数据库中的 `app_users.role`：

- `role = 'user'`：进入 `/app`，继续走用户站内资料/问卷/参与/匹配流程。
- `role = 'admin'`：登录成功后直接进入 `/admin`。

这里必须额外明确一件事：

- “登录成功后跳到哪里”只是登录后的分流逻辑，不是权限控制本身。
- 真正的权限控制必须落在 `/admin` 路由自身，以及 `/admin` 下的服务端数据读取和写入动作上。
- 也就是说，不能因为“普通用户默认被跳去 `/app`”就认为后台安全已经成立。

固定控制链路如下：

1. 所有人都使用同一个登录页登录。
2. 登录成功后，服务端读取当前用户的 `app_users.role`。
3. 如果 `role = 'user'`，跳转到 `/app`。
4. 如果 `role = 'admin'`，跳转到 `/admin`。
5. 任意用户手动访问 `/admin` 或 `/admin/*` 时，服务端必须再次校验当前用户是否为 `admin`。
6. 非 admin 即使手动把地址改成 `/admin`，也必须被重定向回 `/app`，或直接返回 403，不允许进入后台页面。
7. `/admin` 下所有 server action、数据查询入口、批次操作入口、问卷发布入口，也都必须再次做管理员校验，不能只靠前端隐藏按钮。

这条链路的含义是：

- `/admin` 的安全边界建立在“服务端角色校验”上，而不是“用户不知道 `/admin` 地址”。
- 前端是否显示“管理员入口”只影响体验，不影响权限。
- 普通用户就算知道管理员路由，也无法真正进入后台。

为什么要这样定：

- 这是当前 schema 已经支持的最短路径。
- RLS 已经围绕 `public.is_admin()` 建好了，继续沿用最稳。
- 不需要维护两套认证系统。
- 不需要在前端硬编码开发者邮箱名单。
- 后续如果增加多个管理员，也还是同一套角色体系，不会推翻已有实现。

这里还要明确 RLS 与页面权限的分工：

- RLS 负责保护数据库中的管理员数据和管理员写操作，防止普通用户直接读写不该访问的表数据。
- `/admin` 路由守卫负责保护后台页面本身，避免普通用户仅靠改 URL 就进入后台壳层。
- server action 权限校验负责保护后台操作入口，避免普通用户绕过页面 UI 直接发请求。

三层都要有，不能只做其中一层。

管理员初始化方式：

- 第一版不做“在线申请成为管理员”。
- 首个管理员账号由运营在 Supabase 后台或 SQL Editor 中，将对应 `app_users.role` 更新为 `admin`。
- 这是一次性初始化动作，不需要为此新做一套复杂权限发放系统。

### 3.2 问卷更新怎么做

平台当前按固定节奏运营：

- 每周三 12:00 截止报名。
- 从报名截止到结果公布之间，问卷填写通道关闭。
- 当前规划下，结果公布时间为同一天 20:00。
- 这段关闭窗口内，后台只做两件事：计算并发布本轮结果；如有需要，导入并发布下一轮要使用的新问卷版本。
- 问卷版本不是每个轮次都会自动更新；只有管理员真的上传了新问卷，系统才会生成新版本。
- 如果管理员没有上传新问卷，则下一轮继续沿用当前已发布版本，用户也不需要重新填写。

问卷更新采用唯一流程：

1. 管理员在需要更新问卷时，后台导入结构化 JSON 问卷定义。
2. 当且仅当管理员导入了新问卷 JSON，系统才生成 `version_no = 上一版 + 1` 的新 `draft` 问卷版本。
3. 后台预览。
4. 后台点击发布。
5. 原 `published` 版本转为 `archived`，新版本成为唯一 `published`。

固定规则：

- 不做 Excel 直导。
- 导入方式固定只支持后台粘贴 JSON，不做 `.json` 文件上传。
- 不做复杂图形化问卷编辑器。
- 管理员每次更新问卷时，只提交一份完整 JSON；这份 JSON 同时包含题目定义和匹配规则配置，不存在“单独上传算法代码”这一步。
- 问卷题型固定只允许 `single / multiple / scale`。
- 现有 `text` 题型及其相关前端渲染、服务端校验、匹配计算残余逻辑要彻底删除。
- 强制只允许一个 `draft` 问卷版本存在。
- 不允许同时存在两个 `published` 问卷版本。
- 当存在 `open` 批次时，不允许导入、重导或发布新问卷版本。
- 新问卷版本只允许在当前轮次报名截止后、问卷通道关闭的窗口内导入和发布。
- 已经开放或已经运行的批次，不允许中途切换问卷版本。
- 新版本只影响新批次和后续用户填写状态，不回写旧批次历史。
- 如果没有发布新版本，则当前 `published` 问卷可以连续服务多个轮次。

### 3.3 问卷更新后，用户界面如何变化

这里必须做成严格而且可预期的状态机。

状态判定规则需要分两种情况：

- 如果当前存在 `open` 批次，用户是否“已填写当前问卷”，以该批次绑定的 `questionnaire_version_id` 为准。
- 如果当前不存在 `open` 批次，用户是否“已填写当前问卷”，以当前唯一 `published` 版本为准。

同时要补一条固定的关闭窗口规则：

- 从报名截止到结果公布之间，`/app/questionnaire` 只能显示“当前轮问卷通道已关闭”的说明，不允许保存 draft，也不允许正式提交。
- 这个关闭窗口内，普通用户不能通过补填问卷来影响已经截止的当前轮次。

在非关闭窗口内，状态规则如下：

- 用户只提交过旧版本，未提交新版本：
  - 首页 `问卷状态` 显示 `未填写`
  - `/app` 入口守卫把用户送到 `/app/questionnaire`
  - `/app/participation` 不允许报名
- 用户开始填写新版本，只保存了 draft，没有正式提交：
  - 仍然视为 `未填写`
  - 仍然只能优先完成问卷
- 用户正式提交新版本：
  - 首页 `问卷状态` 显示 `已填写`
  - `/app` 守卫放行到真正首页
  - 可以继续参与当前开放批次

也就是说，问卷一旦更新，用户界面应当自动回到“未填写”状态，直到用户对当前已发布版本完成正式提交为止。

反过来说：

- 如果管理员没有发布新问卷版本，用户不会因为进入新一轮就被要求每周重填。
- 在允许填写问卷的时间段内，如果当前没有发布新版本，用户可以继续修改自己已经填写过的当前版本问卷，并重新提交。
- 对同一已发布问卷版本，系统以用户最后一次正式提交的内容作为有效答案。
- 只有“出现了新的已发布问卷版本”这件事本身，才会触发重新填写要求。

这套逻辑当前已经有一半基础：

- `proxy.ts` 会检查当前已发布问卷版本是否存在 `submitted` 提交。
- `getQuestionnaireState` 已经按当前已发布版本读取问卷。

接下来需要补的是：

- 关闭窗口内的问卷只读状态与保存/提交禁用。
- 管理员发布新版本后的用户提示文案。
- 问卷页头部状态条。
- 首页与参与页的说明文案统一。
- 后台发布动作后的验证链路测试。

### 3.4 匹配计算在哪里进行，逻辑写在哪里

匹配计算固定只在服务端进行，不允许把全部答案导出到站外算完再导回。

唯一计算中心：

- 核心计算逻辑：`src/lib/matching/batch-runner.ts`
- 定时入口：`src/app/api/internal/batch-runner/route.ts`

固定责任划分：

- `processBatch(batch)` 负责读取已锁定参与者、问卷答案、计算配对、写入 `match_pairs` 和 `match_results`。
- `publishBatch(batchId)` 负责释放结果、生成通知、发邮件。
- `runBatchLifecycle()` 负责整轮调度：锁定到期批次、执行匹配、发布结果。

本轮不改匹配算法方向，只补齐运营可用性：

- 继续只对 `single / multiple / scale` 题型计分。
- 继续使用当前的服务端贪心选配策略。
- 不新增文本题打分。
- 不新增站外算法服务。
- 不新增第二套“后台手算匹配逻辑”。
- 不把可执行的匹配代码片段存进数据库。
- 匹配不是为了最大化配对率；低于阈值的候选不强行配对。

这里必须再明确一个固定结论：

- 计算逻辑与问卷版本高度绑定。
- 但这里的“逻辑”不是一段可上传的新代码，而是一套由 JSON 描述的匹配规则配置。
- 真正执行计算的代码固定放在仓库内，由服务端的通用匹配引擎调用。
- 管理员更新问卷时，提交的是“题目定义 + 匹配规则配置”，不是“题目定义 + 可执行算法源码”。
- 匹配输入分成两部分：
  - 用户基础资料：`gender`、`grade`、`department`、`campus`、`birth_year`
  - 问卷答案：`single / multiple / scale` 三类题目的答案
- 这意味着基础资料不需要伪装成问卷题目；它们由匹配规则配置直接引用。
- 第一版性别规则固定为“仅允许异性匹配”，这是硬性过滤条件，不为了提高匹配率而放宽。
- 第一版必须定义最低匹配阈值；任何候选对低于阈值都直接视为不可匹配。

固定存储方式：

- `questionnaire_versions` 上增加：
  - `matching_policy_json`
- `questionnaire_questions` 上增加：
  - `weight`
- `match_batches` 上增加：
  - `matching_policy_snapshot_json`

固定调用方式：

1. 后台导入问卷 JSON 时，同时导入题目结构和 `matchingPolicy`。
2. 服务端用 Zod 校验 JSON，并把规则配置落到 `questionnaire_versions.matching_policy_json`。
3. 问卷版本发布后，这套题目定义和 `matchingPolicy` 一起冻结。
4. 创建批次时，把问卷版本上的 `matching_policy_json` 原样快照到 `match_batches.matching_policy_snapshot_json`。
5. 跑批时，`processBatch(batch)` 读取：
   - 当前 batch 绑定的问卷版本
   - 用户基础资料
   - 用户问卷答案
   - `matching_policy_snapshot_json`
6. 服务端固定通用匹配引擎先按资料规则做过滤，再按资料计分规则和问卷计分规则完成打分、排序、配对。
7. 历史批次始终按自己的问卷版本和 policy snapshot 计算与复跑，不受后续新问卷版本影响。

为什么固定这样做：

- 可以保证历史批次结果可复现。
- 可以保证新问卷版本切换新规则时，不会污染旧批次。
- 算法实现仍留在代码仓库中，可测试、可 review、可回滚。
- 管理员只需要维护一份 JSON，不需要额外上传算法代码。
- 避免把可执行代码存数据库带来的安全风险和维护复杂度。

明确不采用的方案：

- 不把 JS / TS 代码片段直接存进数据库再动态执行。
- 不做“管理员上传算法代码”这条链路。
- 不额外引入一层 `matcher registry` 让管理员去选择多套代码算法。
- 不只保留一个“当前默认算法”然后让所有批次共用。
- 不让批次在运行时回头读取“当前最新问卷版本配置”。
- 不为了追求更高配对数而绕过最低匹配阈值。

需要补齐的不是“再发明一个算法”，而是：

- 把人工触发入口补到后台。
- 把批次的截止时间、计算时间、结果发布时间配置补到后台。
- 把“最近一次匹配计算是成功还是失败”明确展示到后台。
- 把问卷版本上的 `matchingPolicy` 与批次上的 policy snapshot 设计补完整。
- 把失败状态、复跑能力、操作日志补完整。
- 把算法相关测试补齐到能覆盖发布前的核心风险。

### 3.5 删号和明确不做的功能

账号相关的固定结论如下：

- `export_data` 不是目标功能，第一版不做，也不保留占位入口。
- 现有 `export_data` 相关文案、表单项、后台计划、测试项都要从方案中删除。
- `delete_account` 不走工单审批流，不做导出打包前置流程。
- 删号由用户自己在设置页触发，不需要管理员审批。
- 用户点击删除账号后，必须先弹出二次确认；只有再次确认后才真正执行。
- 删号不做物理删除，固定采用软删除。
- 软删除执行后，必须禁止该账号再次登录，但保留其业务历史数据、历史问卷、历史匹配结果、通知与操作日志。
- 后台用户管理页只负责查看用户状态，不再承担“管理员手动删号”这条主链路。

“联系我们”与工单相关的固定结论如下：

- `/contact` 页面保留，但只显示联系方式和说明文案。
- 不再提供输入问题并提交工单的表单。
- `service_requests` 表、`create_service_request` RPC、相关前端 action 和设置页申请入口全部删除。

这里必须明确实现前提：

- 软删除必须同时作用于认证和业务两侧：业务侧写入 `account_status = 'deleted'` / `deleted_at`，认证侧要禁止再次登录。
- 不能让“已删除账号”继续保留有效 session 或继续通过邮箱密码登录。
- 因为历史数据要保留，不能再沿用“物理删除用户触发级联删除”的思路；如果当前 schema 与这一点冲突，就直接改表和改链路。

## 4. 问卷 JSON 输入格式

后台导入问卷时只接受结构化 JSON。第一版固定只支持“后台粘贴 JSON 文本”，不做多格式兼容，也不做 `.json` 文件上传。这里导入的不是“只有题目的问卷 JSON”，而是“题目定义 + 匹配规则配置”的完整 JSON。问卷只允许 `single / multiple / scale` 三种选择题类型。

```json
{
  "title": "2026 春季深度问卷",
  "description": "用于本阶段匹配的正式问卷版本",
  "matchingPolicy": {
    "minimumPairScore": 60,
    "profileFilters": [
      {
        "field": "gender",
        "mode": "opposite_required"
      }
    ],
    "profileScoring": [
      {
        "field": "grade",
        "mode": "same_bonus",
        "weight": 0.6
      },
      {
        "field": "department",
        "mode": "same_bonus",
        "weight": 0.4
      },
      {
        "field": "campus",
        "mode": "same_bonus",
        "weight": 0.2
      },
      {
        "field": "birth_year",
        "mode": "distance_penalty",
        "maxGap": 4,
        "weight": 0.5
      }
    ],
    "questionScoring": {
      "singleDefaultWeight": 1,
      "multipleDefaultWeight": 1.2,
      "scaleDefaultWeight": 1.5,
      "minimumComparableQuestions": 6
    }
  },
  "sections": [
    {
      "code": "campus-life",
      "title": "校园生活",
      "subtitle": "日常节奏与活动偏好",
      "description": "本 section 示例覆盖 single / multiple / scale 三种选择题类型。",
      "sortOrder": 1,
      "questions": [
        {
          "questionCode": "q-campus-rhythm",
          "kind": "single",
          "prompt": "你更喜欢哪种校园节奏？",
          "helperText": "single 示例：只能选一个选项。",
          "isRequired": true,
          "weight": 1.1,
          "sortOrder": 1,
          "options": [
            { "id": "slow", "label": "慢节奏" },
            { "id": "balanced", "label": "平衡一些" },
            { "id": "fast", "label": "快节奏" }
          ]
        },
        {
          "questionCode": "q-weekend-plan",
          "kind": "multiple",
          "prompt": "周末你通常愿意做哪些事？",
          "helperText": "multiple 示例：可以选择多个选项。",
          "isRequired": true,
          "weight": 1.3,
          "sortOrder": 2,
          "options": [
            { "id": "study", "label": "自习或学习" },
            { "id": "sports", "label": "运动" },
            { "id": "walk", "label": "散步或逛校园" },
            { "id": "cafe", "label": "咖啡馆或聊天" },
            { "id": "indoors", "label": "寝室休息" }
          ]
        },
        {
          "questionCode": "q-social-frequency",
          "kind": "scale",
          "prompt": "你希望一周中线下见面或深度相处的频率接近什么程度？",
          "helperText": "scale 示例：在固定区间内选择一个整数。",
          "isRequired": true,
          "weight": 1.5,
          "sortOrder": 3,
          "scaleMin": 1,
          "scaleMax": 5,
          "scaleLeftLabel": "更低频",
          "scaleRightLabel": "更高频"
        }
      ]
    },
    {
      "code": "relationship-style",
      "title": "相处方式",
      "subtitle": "沟通偏好与节奏感",
      "description": "用于说明 section 可以包含多组选择题。",
      "sortOrder": 2,
      "questions": [
        {
          "questionCode": "q-communication-style",
          "kind": "single",
          "prompt": "你更偏好的沟通方式是什么？",
          "helperText": "再次给出 single 示例，便于运营照着扩写。",
          "isRequired": true,
          "weight": 1,
          "sortOrder": 1,
          "options": [
            { "id": "direct", "label": "直接表达" },
            { "id": "gentle", "label": "温和铺垫" },
            { "id": "humor", "label": "轻松幽默" }
          ]
        },
        {
          "questionCode": "q-conflict-response",
          "kind": "multiple",
          "prompt": "遇到分歧时你更希望对方怎么做？",
          "helperText": "再次给出 multiple 示例，说明可有多个偏好。",
          "isRequired": false,
          "weight": 1.2,
          "sortOrder": 2,
          "options": [
            { "id": "listen", "label": "先耐心听完" },
            { "id": "respond-fast", "label": "尽快回应" },
            { "id": "give-space", "label": "先给一点空间" },
            { "id": "face-to-face", "label": "线下当面沟通" }
          ]
        },
        {
          "questionCode": "q-planning-level",
          "kind": "scale",
          "prompt": "你希望关系推进节奏更接近哪一端？",
          "helperText": "scale 也可以用于描述连续偏好程度。",
          "isRequired": true,
          "weight": 1.4,
          "sortOrder": 3,
          "scaleMin": 1,
          "scaleMax": 7,
          "scaleLeftLabel": "顺其自然",
          "scaleRightLabel": "更有计划"
        }
      ]
    }
  ]
}
```

字段规则：

- `matchingPolicy` 必填，用于描述这一版问卷对应的匹配规则。
- `matchingPolicy` 只描述规则配置，不包含可执行代码；管理员不需要、也不能上传算法源码。
- `matchingPolicy.minimumPairScore` 必填，表示最低匹配阈值。低于该分数的候选对直接丢弃，不为了提高匹配率强行配对。
- `matchingPolicy.profileFilters` 用于声明硬性过滤规则。第一版只允许且必须包含 `gender = opposite_required`。
- `matchingPolicy.profileScoring` 用于声明基础资料字段的计分规则。可引用的字段固定为：`grade`、`department`、`campus`、`birth_year`。
- `matchingPolicy.questionScoring` 必填，用于声明题型默认权重和最小可比较题数。
- `section.code` 在同一版本内唯一。
- `question.questionCode` 在同一版本内唯一。
- `kind` 只允许是 `single | multiple | scale`。
- `weight` 必须落表到 `questionnaire_questions.weight`；如果题目未单独声明，服务端使用 `matchingPolicy.questionScoring` 中该题型的默认权重写入该字段。
- `kind = single | multiple` 时必须有 `options`，且至少有 2 个选项。
- 同一题内 `options.id` 必须唯一，`options.label` 不能为空。
- `kind = scale` 时必须提供 `scaleMin`、`scaleMax`、`scaleLeftLabel`、`scaleRightLabel`，并保证 `scaleMin < scaleMax`。
- `isRequired = false` 只表示该题允许不答，不改变题型结构规则。
- 不允许再出现 `text` 题型；相关 schema 校验、题目渲染、匹配逻辑都要同步清理。
- 基础资料字段如 `gender`、`grade`、`department`、`campus`、`birth_year` 不写进 `sections.questions`，而是在 `matchingPolicy` 中直接引用。
- `matchingPolicy` 会随问卷版本一起发布，并在创建批次时快照到 batch。

第一版固定匹配规则白名单：

- `single`：答案相同得 1 分，不同得 0 分。
- `multiple`：按交集 / 并集计算相似度。
- `scale`：按 `1 - abs(left - right) / (max - min)` 计算相似度。
- `profileScoring.grade` / `department` / `campus` 的 `same_bonus`：相同得 1 分，不同得 0 分。
- `profileScoring.birth_year` 的 `distance_penalty`：按年龄差与 `maxGap` 归一化到 0 到 1。
- 最终总分按所有有效信号的加权平均值计算，乘以 100 后取整。
- 如果可比较题数小于 `minimumComparableQuestions`，候选对直接丢弃。
- 如果最终总分低于 `minimumPairScore`，候选对直接丢弃。

这套 JSON 的校验放在服务端，用 Zod 做第一层校验，再落表。

## 5. 分阶段实施计划

### Phase 1. 管理员认证、路由与壳层

目标：先把“管理员能进后台”这条主链路打通。

需要修改或新增的区域：

- `src/lib/auth/session.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/supabase/proxy.ts`
- `src/components/site-shell.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`

任务清单：

- 新增 `getCurrentAppRole()`，从 `app_users` 读取当前登录用户的 `role`。
- 将现有路由守卫扩展为“角色分流 + 用户 onboarding 分流”两层逻辑。
- 新增 `/admin` 路由树，并给后台单独的 `AdminShell`。
- 管理员访问 `/app` 时，直接重定向到 `/admin`。
- 普通用户访问 `/admin` 时，直接拒绝并重定向回 `/app`。
- 登录成功后的跳转改为：
  - admin -> `/admin`
  - user -> `/app`

验收标准：

- 同一个登录页可以同时服务普通用户和管理员。
- 管理员不会再被普通用户资料/问卷守卫拦住。
- 普通用户无法进入后台页面。
- UI 风格延续现有站内样式，不出现另一套后台主题。

### Phase 2. 后台首页总览

目标：让管理员一登录就能看到平台当前运营状态。

建议页面：

- `/admin`

模块：

- 当前用户总数
- 最近 30 天新增用户数
- 当前已发布问卷版本号
- 当前问卷填写人数与填写率
- 当前开放批次名称、状态、报名人数
- 当前批次的报名截止时间、匹配计算时间、结果发布时间
- 最近一次已发布批次的匹配人数与未匹配人数
- 最近一次匹配计算结果状态：成功或失败
- 最近公告状态
- 最近操作日志

数据来源：

- `app_users`
- `questionnaire_versions`
- `questionnaire_submissions`
- `match_batches`
- `batch_participations`
- `match_results`
- `announcements`
- `operation_logs`

实施方式：

- 新建 `src/features/admin/data.ts` 统一提供后台聚合查询。
- 不把这些查询散落到每个 page 中。
- 对需要跨多表聚合的地方，优先写清晰的 server-side typed query；没有必要为了后台首页再引入额外 ORM。

验收标准：

- 管理员能一眼知道“当前平台是否在正常运转”。
- 空数据状态也能正常展示，不报错、不空白。

### Phase 3. 问卷版本后台

目标：把“导入 JSON -> 生成 draft -> 预览 -> 发布”真正做成运营可用流程。

建议页面：

- `/admin/questionnaires`
- `/admin/questionnaires/import`
- `/admin/questionnaires/[versionId]`

建议代码位置：

- `src/features/admin/questionnaires/schema.ts`
- `src/features/admin/questionnaires/data.ts`
- `src/features/admin/questionnaires/actions.ts`

任务清单：

- 问卷版本列表页：
  - 展示 `version_no`、`status`、`title`、`created_at`、`published_at`
  - 区分 `draft / published / archived`
  - 明确显示当前是否存在可继续编辑的唯一 `draft`
- 导入页：
  - 固定只提供 JSON 粘贴区
  - 服务端用 Zod 校验 JSON
  - 如果已存在 `draft`，则先删除旧 `draft` 再重建，始终保证系统里只有一个 `draft`
  - 校验通过后生成新 `draft` 版本和其下的 sections / questions
  - 明确拒绝 `single / multiple / scale` 之外的题型
  - 同时校验 `matchingPolicy`
  - 管理员每次更新问卷时，只能导入一份完整 JSON；这份 JSON 必须同时包含题目定义和匹配规则配置
  - 当存在 `open` 批次时，直接拒绝导入与发布
- 预览页：
  - 直接复用用户问卷渲染结构，不重复发明第二套问卷预览 UI
  - 显示版本元信息 + `matchingPolicy` 摘要 + section/question 排布
- 发布动作：
  - 仅允许在“当前没有 `open` 批次、且问卷通道关闭”的窗口执行
  - 将当前 `published` 改为 `archived`
  - 将当前 `draft` 改为 `published`
  - 写入 `published_at`
  - 记一条 `operation_logs`
- 删除 draft / 重新导入 draft：
  - 只允许对 `draft` 版本操作
  - 已发布版本不允许直接修改内容
- 旧逻辑清理：
  - `text` 题型相关 schema、问卷渲染、答案解析、匹配计算分支彻底删除
  - 不再保留“未来也许会支持文本题”的兼容代码
  - 现有硬编码在 `batch-runner` 中、且无法按版本切换的默认问卷算法入口，要重构成“固定通用引擎 + matchingPolicy 调度”

必须明确的用户联动规则：

- 发布新问卷版本后，所有只完成旧版本的普通用户，自动回到“当前问卷未填写”状态。
- 当存在 `open` 批次时，首页、问卷页、参与页、`/app` 守卫以该批次绑定的问卷版本为准。
- 当不存在 `open` 批次时，再回退到当前唯一 `published` 版本。
- 历史批次仍然引用各自绑定时的版本，不受影响。

验收标准：

- 管理员不需要碰数据库，就能独立完成问卷发布。
- 发布新版本后，用户状态自动刷新到正确结果。
- 已开放批次不会被中途换问卷版本。

### Phase 4. 批次后台与匹配运营

目标：让运营能管理每周批次，并对跑批进行人工观察和干预。

建议页面：

- `/admin/batches`
- `/admin/batches/[batchId]`

建议代码位置：

- `src/features/admin/batches/data.ts`
- `src/features/admin/batches/actions.ts`
- `src/lib/matching/batch-runner.ts`

任务清单：

- 批次列表页：
  - 展示 `code`、`label`、`questionnaire_version_id`、时间窗口、`status`
  - 展示报名人数、锁定人数、已发布结果人数
  - 展示 `signup_end_at`、`match_run_at`、`result_publish_at`
  - 展示当前批次绑定的 `matching_policy_snapshot_json` 摘要
  - 展示最近一次匹配执行结果：成功或失败
- 创建批次：
  - 同一时间只允许存在一个当前轮次；如果已有处于 `draft / open / locked / processing / failed` 的批次，则拒绝新建
  - 只允许选择已发布问卷版本
  - 批次编号和展示用轮次号由系统自动递增生成，不允许人工手改
  - 必须能设置报名截止时间 `signup_end_at`
  - 必须能设置开始进行匹配计算的时间 `match_run_at`
  - 必须能设置结果发布时间 `result_publish_at`
  - 校验 `signup_start_at < signup_end_at < match_run_at < result_publish_at`
  - 创建时必须把问卷版本上的 `matching_policy_json` 一起快照到 batch
  - 新批次默认从 `draft` 开始
- 编辑批次：
  - 仅 `draft` 批次允许改问卷版本
  - `open` 之后不允许改问卷版本
  - 在允许编辑的状态下，可以修改 `signup_end_at`、`match_run_at`、`result_publish_at`
  - 可补充 `notes`
- 批次动作：
  - 打开报名
  - 关闭报名并锁定
  - 立即执行匹配
  - 立即公布结果
  - 失败后重新运行
- 详情页：
  - 展示参与人数、锁定人数、已生成 pair 数、未匹配人数
  - 展示最近操作日志
  - 展示使用中的问卷版本号
  - 展示 `matching_policy_snapshot_json` 摘要
  - 展示截止时间、计算时间、结果发布时间
  - 展示最近一次匹配计算结果是成功还是失败
  - 如果失败，展示失败原因、错误摘要和管理员需要介入处理的提示

跑批逻辑处理要求：

- 自动跑批仍走 `src/app/api/internal/batch-runner/route.ts` + Vercel Cron。
- 手动跑批也必须复用 `src/lib/matching/batch-runner.ts` 的同一套核心函数。
- 不允许后台再写一套独立匹配逻辑。
- 真正执行比较和打分时，必须读取 batch 上冻结的 `matching_policy_snapshot_json`，交给固定通用匹配引擎执行。
- 不允许 batch 在运行时回头读取“当前最新问卷版本规则”。
- 已 `published` 的批次不允许重跑，结果永久保留在数据库中。
- 批次失败后不允许静默跳过，必须停在 `failed` 并等待管理员修复后手动重跑。

需要补强的点：

- `runBatchLifecycle()` 增加错误捕获与失败状态回写。
- `processBatch()` / `publishBatch()` 出错时，把批次状态更新为 `failed`，写入失败原因和操作日志。
- 把现有零散得分逻辑统一收口，不要让匹配公式同时散落在多个 helper 里。
- 后台必须能区分“尚未到计算时间”“计算中”“计算成功”“计算失败”。
- 把现有比较逻辑收敛成一套固定通用引擎，由 `matchingPolicy` 驱动资料过滤、资料计分和问卷计分。
- 把当前批次状态枚举收敛成 `draft -> open -> locked -> processing -> published`，异常态只有 `failed`；现有 `cancelled` 要直接移除。

验收标准：

- 后台能独立创建和推进一个完整批次。
- 定时和手动操作走的是同一套核心逻辑。
- 运营能明确看到当前批次的截止时间、计算时间、结果发布时间。
- 历史批次按自己的 policy snapshot 复跑时，结果口径不受新版本问卷影响。
- 最低匹配阈值生效后，不会为了提高配对率强行输出低质量匹配。
- 跑批失败时，后台能看到明确失败状态，而不是 silent failure。

### Phase 5. 公告后台、平台配置与用户管理

目标：把运营需要日常维护的内容项和账号管理入口补齐。

建议页面：

- `/admin/announcements`
- `/admin/configs`
- `/admin/users`

任务清单：

- 公告后台：
  - 列表展示 `title`、`eyebrow`、`audience`、`status`、时间窗口
  - 支持新建 `draft`
  - 支持发布
  - 支持归档
  - 支持编辑未发布内容
- 平台配置后台：
  - 编辑 `match_schedule_text`
  - 不提供 `allowed_email_domains` 编辑入口
  - `weekly_participation_open`、`repeat_match_cooldown_days`、`feature_flags` 视为无效旧配置，直接从代码和配置数据中清理
- 用户管理后台：
  - 展示用户基础资料、角色、资料完成状态、问卷提交状态、最近参与状态
  - 展示账号是否已软删除、是否被禁止登录
  - 不提供后台直接删号主入口
  - 不做 `export_data`
  - 不做工单式审批流

实现原则：

- 继续使用现有 `announcements`、`app_configs` 表，不新造后台配置表。
- 配置修改统一走 server action，写完立即 `revalidatePath`。
- 用户管理只保留查看能力，不扩展成复杂运营 CRM。

验收标准：

- 运营不需要手写 SQL 就能更新公告和基本运营配置。
- 公告发布时间和可见受众行为与现有 RLS 规则一致。
- 不再保留 `export_data`、工单式删号和无效旧配置。

### Phase 6. 用户侧剩余补完

目标：把因后台能力补齐而需要联动的用户侧体验补完整。

需要补的用户侧点：

- 问卷页增加明确状态提示：
  - 当前版本未开始
  - 当前轮问卷通道已关闭
  - 当前版本草稿未提交
  - 当前版本已提交
- 当管理员发布新问卷版本后：
  - 首页问卷状态立即按新版本重算
  - 参与页理由文案立即变成“请先正式提交当前问卷”
- 设置页的删号入口改成：
  - 点击删除账号
  - 弹出二次确认
  - 确认后立即执行软删除并退出登录
- `/contact` 改成只展示联系方式和说明文案的静态看板
- 匹配记录详情继续沿用当前结构，但需要补后台触发后的完整查看链路校验
- 最近通知最好补一个“标记已读”入口，避免 `mark_notification_read` RPC 只存在于数据库、没有 UI 使用方

验收标准：

- 用户可以从界面上理解自己为什么被要求重新填写问卷。
- 后台发布动作完成后，用户状态、首页、参与页、问卷页文案一致。
- 用户可以自助完成删号，且删号后不能再次登录，但历史数据仍保留。

### Phase 7. 测试、部署与运行方式

目标：让后台与跑批上线后是可维护的，而不是“只能本地演示”。

测试清单：

- 问卷 JSON 校验单元测试
- 问卷版本与 `matching_policy_json` 绑定测试
- 问卷发布状态流转测试
- 问卷关闭窗口测试
- 用户问卷版本切换后的守卫测试
- 管理员/普通用户路由分流测试
- 批次时间窗口校验测试
- 全站仅一个 `open` 批次测试
- 批次编号自动递增测试
- 批次 `matching_policy_snapshot_json` 冻结测试
- 批次计算成功 / 失败状态测试
- 批次失败后可重跑、已发布后不可重跑测试
- 问卷题型白名单与 `text` 清理测试
- 固定通用匹配引擎测试
- 异性过滤与最低匹配阈值测试
- 后台权限测试
- 删号 action 测试
- 联系我们静态看板测试

运行链路：

- Vercel Cron 定时调用 `/api/internal/batch-runner`
- 使用 `CRON_SECRET` 保护内部接口
- 手动后台操作不调用 secret 接口，而是通过 server action 直接走同一核心函数

部署前检查：

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- 如有 migration，执行 `supabase db push`
- 重新生成 `src/types/database.generated.ts`

## 6. 文件级实施清单

下面这份清单是按“预计会动到的代码区域”整理的，便于实施时控制范围。

预计新增：

- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/questionnaires/page.tsx`
- `src/app/admin/questionnaires/import/page.tsx`
- `src/app/admin/questionnaires/[versionId]/page.tsx`
- `src/app/admin/batches/page.tsx`
- `src/app/admin/batches/[batchId]/page.tsx`
- `src/app/admin/announcements/page.tsx`
- `src/app/admin/configs/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/features/admin/data.ts`
- `src/features/admin/actions.ts`
- `src/features/admin/questionnaires/schema.ts`

预计修改：

- `src/lib/auth/session.ts`
- `src/lib/auth/permissions.ts`
- `src/lib/supabase/proxy.ts`
- `src/components/site-shell.tsx`
- `src/features/app/data.ts`
- `src/features/app/actions.ts`
- `src/app/contact/page.tsx`
- `src/app/app/settings/page.tsx`
- `src/app/app/questionnaire/page.tsx`
- `src/app/app/dashboard/page.tsx`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/auth/confirm/route.ts`
- `src/lib/matching/batch-runner.ts`
- `src/app/api/internal/batch-runner/route.ts`
- `src/types/database.generated.ts`

是否需要 migration：

- 管理员后台第一版大概率不需要新增核心业务表，因为现有 schema 已经足够支撑。
- 但如果实施中发现现有表结构、字段命名、约束设计与最终方案冲突，不做兼容层，直接通过 migration 改表。
- 如果现有 `questionnaire_versions`、`questionnaire_questions` 与 `match_batches` 缺少 `matching_policy_json`、`weight`、`matching_policy_snapshot_json` 字段，直接补 migration 改表，不做兼容保留。
- 如果现有数据库没有强制“唯一 `draft` 问卷版本”和“唯一当前轮次”，直接补唯一约束或唯一索引收口。
- 如果现有 `match_batches.status` 仍包含 `cancelled`，直接重构状态约束并删除这一路径。
- 如果现有 `questionnaire_questions.kind` 仍包含 `text`，直接重构约束并删除该题型。
- 如果现有删号链路仍以物理删除和级联删除为前提，直接重构为软删除 + 禁止登录。
- `service_requests` 表、`create_service_request` RPC 以及 `export_data` 相关残余直接删除。
- `weekly_participation_open`、`repeat_match_cooldown_days`、`feature_flags` 等无效旧配置直接从配置数据中删除。
- 如果在实施中发现现有批次字段不足以表达“计算成功 / 失败 / 失败原因”，再单独补最小 migration。

## 7. 建议实施顺序

按最短路径，建议严格按这个顺序推进：

1. 管理员角色分流与 `/admin` 骨架
2. 后台首页总览
3. 问卷版本后台
4. 用户侧问卷版本联动
5. 批次后台与手动跑批
6. 公告后台、平台配置与用户管理
7. 测试、部署、联调

原因很简单：

- 没有 `/admin` 骨架，后面的后台工作都无处承载。
- 问卷版本后台和用户联动必须先做清楚，否则批次永远没有稳定输入。
- 批次后台必须建立在问卷版本体系稳定之后。
- 公告、配置与用户管理都是运营层补完，但不会改变主链路输入输出。
