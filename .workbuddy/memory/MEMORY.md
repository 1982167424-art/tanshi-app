# 探时项目长期记忆

## 项目架构
- 前端：Vite + React + TS，部署在 Vercel，域名 textime.top（Cloudflare 代理）
- 后端：Express + better-sqlite3，部署在 Railway，域名 api.textime.top（Cloudflare 代理）
- API 调用链路（已改）：浏览器 → 直连 api.textime.top（跨域，浏览器能过 CF 质询）→ Cloudflare → Railway 后端
- 原链路（已弃用）：浏览器 → textime.top → Vercel rewrite /api/* → api.textime.top（服务器端被 CF 质询拦截）
- 前端生产环境直连 api.textime.top（api.ts 的 API_BASE），开发环境走 Vite proxy
- Token 存 sessionStorage（Vercel rewrite 不支持 httpOnly Cookie）
- 登录/注册接 Cloudflare Turnstile 人机验证

## 2026-07-18 线上 API 全挂诊断
- 现象：textime.top 登录/注册全报"网络问题"，控制台 API 请求失败
- 根因：api.textime.top 在 Cloudflare 开了橙云代理 + Bot 防护(Managed Challenge)。Vercel 服务器端 rewrite 请求从数据中心 IP 出去，被 CF 判定为机器人，返回 JS Challenge 质询页(HTML, cf-mitigated: challenge, HTTP 403)。服务器端无法执行 JS 质询 → 所有 /api 请求拿到 HTML 而非 JSON → 前端 api.ts 报"网络连接失败"
- 验证：直连 api.textime.top/api/health → 200 JSON（住宅 IP 不被质询）；经 textime.top/api/health(Vercel rewrite) → 403 HTML 质询页
- 最优解：Cloudflare 把 api 记录改成 DNS only(灰云)，Vercel 直达 Railway 源站，后端已有 helmet+CORS+安全中间件足够
- 备选：前端改为直连 api.textime.top（跨域，浏览器能过质询），需改 api.ts 的 API_BASE 并重新部署

## 2026-07-18 最终采用方案：前端直连 api.textime.top（用户选择）
- 改动文件：
  - src/utils/api.ts：API_BASE 改为 `import.meta.env.VITE_API_BASE || (PROD ? 'https://api.textime.top' : '') + '/api'`，并 export
  - src/App.tsx：import API_BASE；fetch('/api/days') → fetch(`${API_BASE}/days`)；删除重复 import Verify
  - src/utils/turnstileLoader.ts：import API_BASE；FALLBACK_URL 改为 `${API_BASE}/turnstile/script`
- 验证通过：tsc -b 无错误；跨域预检 OPTIONS → 204 + access-control-allow-origin: https://textime.top + allow-headers: Content-Type,Authorization；GET /api/health 跨域 → 200 JSON
- 后端 CORS 白名单已含 https://textime.top，无需改后端；vercel.json 的 CSP connect-src 已含 https://api.textime.top
- 待用户操作：重新部署前端到 Vercel 即可生效（后端/Cloudflare 不用动）
- 注意：直连会暴露 api.textime.top 域名（原"隐藏原站域名"目的放弃），用户已知悉
- 遗留隐患（已修复 2026-07-19）：App.tsx 第80行 token 读取从 localStorage 改为 sessionStorage，与 api.ts/第66行统一

## 2026-07-19 线上部署修复（关键经验）
- 改完代码后线上一直没生效，根因三层：①git 未 commit/push（Vercel CLI 用 git ls-files 上传，未 commit 的修改不传）；②git push 后 Vercel 未自动部署（GitHub webhook 未配）；③Vercel build cache 导致 `vercel --prod` 构建出旧代码
- 最终方案：`vercel pull --yes` → `vercel build --prod` → `vercel deploy --prod --prebuilt --yes`（本地构建后直接上传，跳过 Vercel build cache）
- vercel.json HTML 缓存改为 `max-age=0, s-maxage=0, must-revalidate`（原 s-maxage=300 导致部署后 HTML 被 CDN 缓存 5 分钟）
- **以后部署流程**：先 git commit + push，再用 prebuilt 模式部署（vercel build + vercel deploy --prebuilt），不要直接 vercel --prod

## 后端部署（Railway）
- Railway 项目名：tanshi-backend-api，用 `railway link --project tanshi-backend-api --environment production` 连接
- **必须在 backend/ 目录下执行 `railway up`**！在项目根目录执行会导致 Railway 用 Railpack 自动检测为前端 Vite 项目，构建前端 dist 并用 Caddy 服务静态文件，后端 Express 根本不会被部署（/api/health 返回前端 index.html）
- Railway 和 Vercel 一样，git push 不会自动触发部署，需手动 `railway up`
- railway.json 在 backend/ 目录下，builder 为 DOCKERFILE
- 数据库 SQLite 挂在 Railway volume（/data），部署不会丢数据

## 2026-07-19 UID 格式正则 Bug（严重）
- 现象：用户报"同步用户信息失败: Error: 用户ID格式无效"
- 根因：backend/src/utils/crypto.js 的 generateUid 生成 `TS` + 14位（时间戳8位+随机6位），但 backend/src/routes/user.routes.js 的正则 `/^TS[A-Z0-9]{8,12}$/` 只允许 8-12 位，14 超出上限
- 影响：所有 GET/PUT/DELETE /api/users/:uid 被拦截（同步信息、更新资料、改密码、注销账号全挂）
- 修复：正则上限从 12 改为 20（`/^TS[A-Z0-9]{8,20}$/`）
- 注意：user.routes.js 中 `router.use(authRequired)` 在 validateUid 之前，所以未认证请求到不了 validateUid，无法用假 token 测试正则

## 代码注意
- App.tsx 曾有重复 import Verify（第12、23行），会导致 tsc 编译失败、Vercel 部署挂掉，已于 2026-07-18 删除第23行
- 前端 api.ts 已内置 cf-mitigated 检测，会抛"API 被 Cloudflare 安全验证拦截"
