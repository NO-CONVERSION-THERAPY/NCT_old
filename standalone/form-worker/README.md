# Standalone Form Worker

这个目录是独立表单填写页的专用 Workers 入口包。它会把表单页面直接挂在 `/`，并复用主仓库中的服务端校验、地区联动、自动补全和提交逻辑。

## 目录内容

- `worker.mjs`：Cloudflare Workers 入口
- `wrangler.jsonc`：专用 Workers 配置
- `.dev.vars.example`：本地开发变量示例
- `package.json`：独立调试 / 部署脚本

## 本地调试

1. 在当前目录复制 `.dev.vars.example` 为 `.dev.vars`
2. 填入至少这些变量：
   - `FORM_PROTECTION_SECRET`
   - `PUBLIC_MAP_DATA_URL` 或 `GOOGLE_SCRIPT_URL`

如果你想覆盖内置默认主表单，也可以额外填写：

- `FORM_ID` 或 `FORM_ID_ENCRYPTED`
3. 运行：

```bash
npm run dev
```

或者从仓库根目录运行：

```bash
npm run dev:workers:standalone-form
```

## Cloudflare Workers 部署

仅推荐使用 Cloudflare Dashboard 的 Workers Builds 网页部署。这个独立问卷 Worker 的项目名使用目录名的 Workers 兼容形式：`nct-old-standalone-form-worker`。

部署命令里的 `npm run cf:ensure` 会自动创建 D1 数据库 `nct-old-standalone-form-worker`、把真实 `database_id` 写入当前构建环境中的 [`wrangler.jsonc`](./wrangler.jsonc)，并执行远端 D1 migrations；不需要再手动创建 D1 或手动填写 `database_id`。

### Workers Builds 填写

| Cloudflare 页面字段 | 填写值 |
| --- | --- |
| Project name | `nct-old-standalone-form-worker` |
| Production branch | 你的生产分支，例如 `main` |
| Path / Root directory | 在本仓库部署填 `NCT_old`；如果本项目单独成库填 `/` |
| Build command | `npm run test:standalone` |
| Deploy command | `npm run deploy:workers:standalone-form` |
| Non-production branch deploy command | `npm run deploy:workers:standalone-form:preview` |

说明：`Path / Root directory` 需要指向 `NCT_old` 项目根，而不是 `standalone/form-worker`，因为这个 Worker 会复用根目录下的服务端代码、模板、静态资源、依赖和 migrations。

### 网页端步骤

1. 进入 Cloudflare Dashboard -> `Workers & Pages` -> `Create` -> `Import a repository`。
2. 选择 Git 仓库后，按上表填写 `Project name`、`Path`、`Build command`、`Deploy command` 和 `Non-production branch deploy command`。
3. 在 `Settings` -> `Variables and Secrets` 配置运行时变量。
4. 在 `Settings` -> `Domains & Routes` -> `Add` -> `Custom Domain` 绑定问卷域名。
5. 推送生产分支触发部署；部署完成后，这个独立 Worker 的首页 `/` 就是问卷填写页。

### 运行时变量

在 Worker 的 `Settings > Variables & Secrets` 中配置运行时变量，不要只填到 Build Variables。

建议至少配置：

- `RUNTIME_TARGET=workers`
- `FRONTEND_VARIANT=legacy`
- `FORM_DRY_RUN=false`
- `FORM_SUBMIT_TARGET=google`
- `FORM_PROTECTION_SECRET`：使用 Secret
- `FORM_ID` 或 `FORM_ID_ENCRYPTED`：可选；留空时会使用内置默认主表单
- `SITE_URL=https://<your-worker>.<your-subdomain>.workers.dev`
- `DEBUG_MOD=false`
- `PUBLIC_MAP_DATA_URL` 或 `GOOGLE_SCRIPT_URL`

如果你只是先让问卷单独上线，推荐先使用：

- `FORM_SUBMIT_TARGET=google`

这样不需要先配置 D1，就可以先把提交链路跑通。

### 可选：启用 D1 落库

如果你希望问卷提交同时写入 D1：

1. 把 `FORM_SUBMIT_TARGET` 改成 `d1` 或 `both`。
2. 推送部署。`Deploy command` 会自动创建并迁移 D1 数据库。

## 说明

- 这个包使用了根目录的源码、模板、D1 migrations 和静态资源，但部署入口、Wrangler 配置和本地 `.dev.vars` 都独立放在这里。
- `wrangler.jsonc` 通过 `base_dir` 指向仓库根目录，只把独立表单实际需要的模板和静态文件打进 bundle。
- Cloudflare 文档说明：`base_dir` 会决定 `rules` 的匹配根目录，`.dev.vars` 需要与 Wrangler 配置文件位于同一目录。
