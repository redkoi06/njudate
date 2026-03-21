# NJU Date

正式开发工程已经初始化完成，运行时技术栈与 [开发文档](./开发文档) 保持一致：

- Next.js 16 App Router
- TypeScript strict mode
- Tailwind CSS 4
- shadcn/ui manual setup
- Supabase Auth / Postgres / SSR client / CLI
- Vercel-ready deployment structure
- Zod / React Hook Form / Resend
- Vitest + Testing Library

`UI_demo` 仅保留为高保真参考，不作为正式运行工程。

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

```bash
cp .env.example .env.local
```

如果使用本地 Supabase，启动后用 `supabase status` 查看本地 URL 和 keys，再回填到 `.env.local`。

3. 启动本地 Supabase

```bash
npm run supabase:start
```

说明：本地 Supabase 依赖 Docker Desktop。

4. 启动 Next.js

```bash
npm run dev
```

打开 `http://localhost:3000`。

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

## 目录说明

- `src/app`: Next App Router 入口
- `src/lib/env`: 环境变量校验
- `src/lib/supabase`: browser/server/admin/proxy 客户端
- `src/lib/email`: 邮件服务封装
- `src/features`: 业务模块
- `src/types/database.generated.ts`: Supabase 类型占位文件，后续由 CLI 覆盖
- `supabase`: 本地数据库配置、迁移、seed
- `UI_demo`: 高保真参考工程

## 已完成的基础设施

- `proxy.ts` 已接入 Supabase SSR session 刷新
- `components.json`、`cn` 工具和 Tailwind theme 已准备好，可直接添加 shadcn 组件
- 引入了 `UI_demo` 的主色和字体方向
- 提供了匹配算法测试样例与权限测试样例

## 当前已验证

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

`npm run supabase:start` 在当前机器上失败，原因是未检测到 Docker Desktop。
