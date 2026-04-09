# NJU Date

面向南京大学校内用户的认真匹配平台。当前仓库对应已完成开发的正式应用，包含完整用户端、管理后台、匹配批次调度与通知链路。

## 已实现

- 用户端：校邮注册登录、资料维护、深度问卷、按周报名、匹配记录、联系方式按规则开放
- 管理端：问卷导入与发布、批次运营、公告维护、平台配置、用户管理
- 系统链路：Supabase 持久化、自动批次生命周期、邮件通知、测试与类型校验

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase Auth / Postgres / Edge Functions
- React Hook Form + Zod
- Nodemailer
- Vitest

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 复制 `.env.example` 为 `.env.local` 并补齐配置

3. 如使用本地 Supabase，启动本地服务

```bash
npm run supabase:start
```

4. 启动开发服务器

```bash
npm run dev
```

默认访问地址：`http://localhost:3000`

## 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run supabase:start
npm run supabase:reset
npm run supabase:types
```

## 环境变量

以 `.env.example` 为准，核心包括：

- 站点地址
- Supabase URL / Publishable Key / Service Role Key
- 内部自动化密钥 `INTERNAL_AUTOMATION_SECRET`、`CRON_SECRET`
- SMTP 发信配置
