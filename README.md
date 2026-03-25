# NJU Date

NJU Date 是一个面向校内用户的认真匹配平台，当前工程按正式运行结构组织。

## 技术栈

- Next.js 16 App Router
- TypeScript strict mode
- Tailwind CSS 4
- Supabase Auth / Postgres / SSR client / CLI
- Zod
- SMTP
- Vitest

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

```bash
cp .env.example .env.local
```

3. 如果使用本地 Supabase，启动服务

```bash
npm run supabase:start
```

4. 启动开发服务器

```bash
npm run dev
```

默认访问地址为 `http://localhost:3000`。

## 环境变量

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase 前端公钥
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SMTP_HOST`: 业务邮件 SMTP 主机
- `SMTP_PORT`: 业务邮件 SMTP 端口
- `SMTP_SECURE`: 业务邮件是否使用 SMTPS，`true` 或 `false`
- `SMTP_USERNAME`: 业务邮件 SMTP 用户名
- `SMTP_PASSWORD`: 业务邮件 SMTP 密码
- `SMTP_FROM_EMAIL`: 业务邮件发件地址
- `SMTP_FROM_NAME`: 业务邮件发件人名称，可选

## 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run format
npm run format:check
npm run supabase:start
npm run supabase:stop
npm run supabase:reset
npm run supabase:types
```

## 运营运行方式

- 批次生命周期完全由管理员手动推进，不存在 Cron，也不存在内部自动跑批入口。
- 标准运行链路为：管理员手动锁定报名 -> 手动执行匹配 -> 手动发布结果。
- 若批次执行失败，只能由管理员手动重跑。
- 若批次卡在 `processing + processed_at = null`，必须先在后台手动重置为 `failed`，再重新执行匹配。

## 部署检查

部署前至少执行：

```bash
npm run lint
npm run typecheck
npm run test
```

如果本次改动包含新的 migration，还需要执行：

```bash
supabase db push
npm run supabase:types
```

## 目录说明

- `src/app`: App Router 页面与接口
- `src/components`: 站点 UI 壳层和基础组件
- `src/features/app`: 用户侧数据读取与 server actions
- `src/lib/auth`: 会话读取
- `src/lib/email`: 邮件发送封装
- `src/lib/matching`: 批次生命周期与匹配执行器
- `src/lib/supabase`: browser/server/admin/proxy 客户端
- `src/types/database.generated.ts`: Supabase 类型定义
- `supabase/migrations`: 数据库 schema 与 seed
- `UI_demo`: 仅作视觉和交互参考，不参与正式运行

## 已验证

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
