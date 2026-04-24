# NCT_old

这个目录现在是从 `No-Torsion` 根目录拆出来的独立 legacy 项目，保留：

- `Express 5` 服务端
- 旧版 `EJS + public/js` 前端
- 原有 standalone / worker / 测试与配置文件

## 运行模式

`NCT_old` 仍然同时保留两种启动方式：

- Node / Express：读取 [`.env.example`](./.env.example) 对应的 `.env`
- Cloudflare Workers：读取 [`.dev.vars.example`](./.dev.vars.example) 对应的 `.dev.vars`

如果你只是想本地维护旧版页面，优先使用 Node 模式；如果你需要继续验证 Workers 兼容行为，再使用 `wrangler`。

## Node 启动

```bash
cd NCT_old
npm install
cp .env.example .env
npm start
```

默认会以 `FRONTEND_VARIANT=legacy` 启动旧版页面。

## Workers 启动

```bash
cd NCT_old
cp .dev.vars.example .dev.vars
npm run dev:workers
```

## 环境变量

最常见的变量分组如下：

- 旧版表单与地图：`FORM_DRY_RUN`、`FORM_SUBMIT_TARGET`、`CORRECTION_SUBMIT_TARGET`、`PUBLIC_MAP_DATA_URL`
- Google Form / 私有数据源：`FORM_ID`、`FORM_ID_ENCRYPTED`、`GOOGLE_SCRIPT_URL`、`GOOGLE_SCRIPT_URL_ENCRYPTED`
- 运行时安全与翻译：`FORM_PROTECTION_SECRET`、`GOOGLE_CLOUD_TRANSLATION_API_KEY`、`TRANSLATION_PROVIDER_TIMEOUT_MS`
- 远程后端代理：`NCT_BACKEND_SERVICE_URL`、`NCT_BACKEND_SERVICE_TOKEN`、`NCT_BACKEND_SERVICE_TIMEOUT_MS`

补充说明：

- `NCT_BACKEND_SERVICE_*` 用于把旧版前端壳层代理到 `nct-api-sql-sub`
- 代码里同时兼容 `BACKEND_SERVICE_URL`、`BACKEND_SERVICE_TOKEN`、`BACKEND_SERVICE_TIMEOUT_MS` 这组三个旧别名
- Node 模式与 Workers 模式变量名保持一致，只是文件分别放在 `.env` 与 `.dev.vars`

## 测试

```bash
cd NCT_old
npm test
```

常用测试命令：

- `npm test`：核心 Node 测试集，包含旧主站、standalone form、worker 响应与后端代理服务
- `npm run test:standalone`：只跑独立表单相关测试
- `npm run test:smoke`：Playwright 冒烟截图巡检

## 说明

- 根目录 `No-Torsion` 现在只负责新的静态 Vite + React 前端。
- 新的表单提交流程已经迁到 `nct-api-sql-sub` 的 Hono 后端。
- 如果你还需要旧版 Express 页面或旧提交流程，请在这个 `NCT_old` 项目里维护。
