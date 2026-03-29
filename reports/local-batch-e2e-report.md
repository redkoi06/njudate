# 本地批次全流程测试报告

## 1. 测试目标

验证当前 V1 问卷与匹配流程在本地 Supabase 环境下是否满足以下要求：

- 算法执行结果与预先设计的样本预期一致
- 批次能够完成 `open -> locked -> processing -> published` 全链路推进
- 用户在结果发布后能正确看到自己的匹配结果与站内通知

## 2. 测试对象

- 批次 ID：`33284519-84cb-4f74-9557-68c4ce438f7c`
- 批次标签：`第 1 轮`
- 问卷版本：`a8dd2195-924d-4452-82e2-23a5c07255dd`
- 参与账号数：9

预期样本设计：

- 预期匹配成功：
  - `11111@smail.nju.edu.cn` ↔ `22222@smail.nju.edu.cn`
  - `33333@smail.nju.edu.cn` ↔ `44444@smail.nju.edu.cn`
  - `55555@smail.nju.edu.cn` ↔ `66666@smail.nju.edu.cn`
- 预期匹配失败：
  - `77777@smail.nju.edu.cn`
  - `88888@smail.nju.edu.cn`
  - `99999@smail.nju.edu.cn`

## 3. 测试步骤

测试过程采用数据库真实执行方式：

1. 确认当前批次处于 `open`，且 9 个账号均已 `joined`
2. 直接修改数据库中的 `signup_end_at`、`match_run_at`、`result_publish_at`
3. 推进批次完成锁定、计算、发布
4. 校验数据库中的配对结果、未匹配结果、通知记录
5. 逐个用户登录验证前端可见结果与通知

## 4. 实际执行结果

### 4.1 批次推进结果

- 批次最终状态：`published`
- `processed_at` 已写入
- `published_at` 已写入
- `last_error_message = null`

### 4.2 算法执行结果

实际匹配对：

- `11111@smail.nju.edu.cn` ↔ `22222@smail.nju.edu.cn`
- `33333@smail.nju.edu.cn` ↔ `44444@smail.nju.edu.cn`
- `55555@smail.nju.edu.cn` ↔ `66666@smail.nju.edu.cn`

实际未匹配：

- `77777@smail.nju.edu.cn`
- `88888@smail.nju.edu.cn`
- `99999@smail.nju.edu.cn`

匹配得分：

- 3 组成功配对的 `score` 全部为 `100`
- 3 个未匹配用户的 `status` 为 `unmatched`，`score = null`

结论：

- 算法执行结果与样本设计预期完全一致

## 5. 用户反馈验证

### 5.1 结果记录

9 个账号全部在登录后能看到 1 条已发布结果：

- 匹配成功用户：`status = matched`
- 未匹配用户：`status = unmatched`
- 每个账号的 `released_at` 均已写入

### 5.2 站内通知

9 个账号全部收到了 1 条匹配结果通知：

- 通知标题：`第 1 轮匹配结果已发布`
- 通知正文：`访问“匹配记录”查看匹配结果吧！`

通知级别：

- 匹配成功用户：`level = success`
- 未匹配用户：`level = info`

### 5.3 结果内容完整性

匹配成功用户：

- `counterpart_snapshot_json` 正确写入对方昵称、性别、年级、院系、校区、出生年
- `reasons` 数量为 5
- `preview_text` 已生成

未匹配用户：

- `counterpart_snapshot_json = null`
- `preview_text = "No match this round."`
- `reasons = null`

结论：

- 站内结果反馈正确
- 站内通知反馈正确

## 6. 发现的问题

### 问题 1：本地 Edge Function 环境未配置完整

现象：

- 本地 `auto-batch-lifecycle` Edge Function 执行时报错，缺少 `CRON_SECRET`

影响：

- 本地环境下“定时任务 -> Edge Function”链路没有直接跑通

说明：

- 这不影响本次数据库真实结果落库
- 本次结果已经真实写入数据库，并能被前端正常读取

### 问题 2：邮件同步未在本次验证范围内完成

现象：

- 匹配结果通知的 `email_status` 仍为 `pending`

说明：

- 本次已验证站内结果和站内通知
- 邮件发送链路本次未作为通过项

## 7. 最终结论

### 已验证通过

- 批次完成锁定、计算、发布
- 匹配算法输出与设计预期一致
- 9 个用户都能正确看到自己的结果与站内通知
- 预期的 3 对成功、3 个失败样本全部命中

### 未纳入通过项

- 本地 Edge Function 的环境配置完整性
- 邮件发送链路
