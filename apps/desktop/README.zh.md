# `@deepseek-ai/dsh-desktop`

[English](README.md) | 中文

**DSH Desktop** 是 DeepSeek Harness 的 Codex 风格桌面壳：可安装窗口负责监护本地 Host，并加载既有 Web UI。Agent 循环、工具、会话、沙箱 × 审批与聊天 UI 仍由 Host 与 `packages/client/*` 承担；本包只拥有 Electron 主进程、Host 生命周期与窗口。

## 它是什么

偏好桌面入口的产品用户可获得与 `dsh web` 相同的本地编码 agent 体验，而无需先学 CLI。该壳会：

- 打开标题为 **DSH Desktop** 的单个 Electron 窗口
- 在回环地址拉起本地 `dsh web`，并等待 `dsh web:` 就绪行
- 在已沙箱化的 `BrowserWindow` 中加载该 origin
- 退出时停止 Host 子进程；再次启动时聚焦已有窗口

此处不重写业务 UI。安装包与自动更新是后续功能，尚不属于本包。

## 安装与开发

树内尚无独立安装包。请从 monorepo 检出运行。

### 要求

- 在仓库根目录安装依赖（`pnpm install`）
- 生产式运行需要已构建的 Host／前端产物（`pnpm run build`）；开发可走源码启动路径（`tsx` + `pnpm dsh`）
- 系统 `PATH` 上有 `node`（不用 Electron 二进制跑 CLI）

### 开发

在仓库根目录：

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-desktop run build
pnpm desktop
```

`pnpm desktop` 会构建本包并启动 Electron。Host 的 `DSH_HOME` 落在 Electron `userData` 下的 `dsh-home`，避免与开发者 CLI 的 home 互相覆盖。

### Host 可靠性

- Host 在打印就绪 URL 之后若意外退出，主进程按上限做指数退避重启，成功后窗口重新加载新 URL。
- 就绪等待默认 120s，可用环境变量 `DSH_DESKTOP_HOST_READY_MS`（正整数毫秒）覆盖。
- Host 的 stdout/stderr 写入有界内存 ring，供崩溃对话框展示近期日志，避免无界缓冲。
- 停止路径跨平台（`SIGTERM` 后 `SIGKILL`）；在 Windows 上额外使用 `taskkill /T`，避免孙进程残留。

### 测试

## 自动更新（同意对话框）

主进程通过 [`electron-updater`](https://www.electron.build/auto-update) 集成更新，**默认偏安全**：

| 行为 | 默认 |
|---|---|
| 启动时检查 | 仅在应用**已打包**时（`app.isPackaged`）。开发态 `electron .` 不发起网络检查，除非 `DSH_DESKTOP_UPDATE_CHECK` 强制开启 |
| 手动检查 | `setupAutoUpdate().checkForUpdates()`，供后续菜单项调用 |
| 自动下载 | **关闭**（`autoDownload = false`） |
| 下载同意 | 发现可用更新时，主进程弹出 **是／否** 对话框询问是否立即下载 |
| 静默安装 | **不会**——只有用户通过 `requestInstallDownloadedUpdate()` 明确同意后才安装 |
| 安装同意 | 下载完成后弹出 **是／否** 对话框询问是否立即重启并安装 |
| 退出时自动安装 | **关闭**，直到用户对已下载更新给出同意 |

尚无客户端设置页控制更新；同意路径仅为主进程 `dialog.showMessageBox`。选择否时继续运行当前版本。

**更新源（占位）：** GitHub Releases，仓库 `Enffun-EL/deepseek-harness`（`provider: github`）。可用环境变量覆盖：

| 变量 | 作用 |
|---|---|
| `DSH_DESKTOP_UPDATE_FEED_URL` | 托管 `latest.yml`／产物的通用 HTTP 目录 |
| `DSH_DESKTOP_UPDATE_GITHUB_OWNER` / `DSH_DESKTOP_UPDATE_GITHUB_REPO` | GitHub Releases 的 owner／repo |
| `DSH_DESKTOP_UPDATE_CHANNEL` | 任一 provider 的 channel |
| `DSH_DESKTOP_UPDATE_CHECK` | `1`／`true` 强制启动检查；`0`／`false`／`off` 关闭 |

### 签名与开发

本骨架**未**配置代码签名与公证。未签名或开发构建可能在校验签名时失败、找不到已发布安装包，或更新器直接 no-op。本地开发如此属预期；生产安装包需在流水线中提供签名产物与真实 publish 配置后，再依赖自动更新。

版本比较、feed URL 构建、更新状态机、同意文案与同意编排等纯函数已做单元测试，无需启动 Electron。

## 首次启动与壳层状态页

本地 Host 启动期间，主进程展示品牌化中文**加载页**（data URL）。Host **失败**或**就绪超时**时展示对应错误页，并提供**重试**（停止旧子进程后重新 boot）。页面由 `src/shell/pages.ts` 中的纯函数生成（可单测；不开启 `nodeIntegration`）。

缺少系统 `node`（spawn `ENOENT` / 不在 `PATH`）时，由 `describeHostLaunchError` 归类为品牌化中文说明，而不是不透明堆栈，并同样提供重试。

每个配置档案**首次**成功加载 Host Web UI 后，壳层在 `did-finish-load` 后注入顶部**欢迎状态条**（最多 3 次、不阻断交互），并自动消失。完成标记写入 Electron `userData` 下的 `desktop-shell-state.json`（字段 `hasCompletedFirstLaunch`）。之后启动不再显示。状态缺失或损坏视为未完成。

壳层窗口安全不变量保持不变：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。

## 打包（electron-builder）

本包提供 [electron-builder](https://www.electron.build/) **24.x** 配置（`electron-builder.yml`；选用 24 是为避开 monorepo 供应链门禁拒绝的 git exotic 子依赖）：

| 平台 | 目标 |
|---|---|
| Windows | NSIS 安装包 + portable（x64） |
| macOS | DMG（x64 + arm64） |
| Linux | AppImage（x64；可选便利目标） |

### 生成安装包

在仓库根目录（先 `pnpm install`）：

```sh
# Unpacked app directory only (fast smoke of the pack layout)
pnpm desktop:pack
# or: pnpm --filter @deepseek-ai/dsh-desktop run pack

# Platform installers for the machine you are on
pnpm desktop:dist
# or: pnpm --filter @deepseek-ai/dsh-desktop run dist

# Explicit targets
pnpm --filter @deepseek-ai/dsh-desktop run dist:win
pnpm --filter @deepseek-ai/dsh-desktop run dist:mac
pnpm --filter @deepseek-ai/dsh-desktop run dist:linux
```

产物位于 `apps/desktop/release/`（已 gitignore）。在非 mac 主机上打 macOS DMG 受 electron-builder 交叉构建限制；配置本身对 CI mac runner 完整可用。

### 打包后的应用如何找到 Host

运行时 `resolveHostRoot` 按下列顺序取第一个命中项：

1. **`DSH_DESKTOP_HOST_ROOT`** — 指向 Host 根（含 `run-host.mjs`，或含已构建 `lib/bin.js` 和／或源码 `src/bin.ts` 的 `apps/cli`）。
2. **`resources/host`** — 由 electron-builder `extraResources` 从 `apps/desktop/host-dist` 拷入的树。
3. **Monorepo 上溯** — 带 `pnpm-workspace.yaml` 与 `apps/cli` 的父目录（开发检出 / `pnpm desktop`）。

`pnpm run ensure-host-dist`（由 `pack` / `dist` 调用）在 monorepo 构建产物存在时向 `host-dist/` 暂存：

| 存在时暂存 | 作用 |
|---|---|
| `apps/cli/lib/**`（及 `package.json`、`config/**`） | 已构建 CLI 入口与 chunk |
| `apps/web/dist/**` | Web SPA 静态资源（若已构建） |
| `run-host.mjs` | 打包启动器：系统 Node → monorepo 桥接或暂存 bin |
| `host-manifest.json` | 模式、打包时 monorepo 路径、残余说明 |

**同机桥接：** 当 `host-manifest.json` 中的打包时 monorepo 路径仍含 `apps/cli/lib/bin.js` 时，`run-host.mjs` 会回指该检出（适合本地 `pack`／开发者安装包）。这是 monorepo 感知打包，**不是**完全离线 Host。

**本 MVP 不捆绑：** 便携 Node.js 二进制；完整 monorepo `node_modules`／pnpm store。无 monorepo 桥接时，仅暂存的 CLI bin 无法解析 workspace 包。

**仍需要系统 Node**（PATH 上的 `^22.19` 或 `>=24`，或 `NODE`／`npm_node_execpath`）。绝不使用 Electron 的 `process.execPath` 作为 Node 二进制。若缺少 Node，shell 通过 `formatHostStartErrorDetail` 展示明确中文错误。

打包时若 monorepo 尚无 CLI 产物，`ensure-host-dist` 仍会写占位目录以满足 electron-builder 源路径；该占位**不可运行** — 请先 `pnpm run build` 再执行 `ensure-host-dist`，或设置 `DSH_DESKTOP_HOST_ROOT`。

### 限制（当前 MVP）

- 完全离线 Host（自带运行时闭包 + 便携 Node）**延后**；打包应用在能发现 Host 根且系统 Node 可用时启动。
- 代码签名、公证与自动更新 feed 发布属发布流水线职责。
- 不保证在单一 OS 上交叉构建全部目标；优先各平台原生 CI runner。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、自动更新与同意对话框 |
| `src/update/auto-update.ts` | electron-updater 接线与需用户同意的控制器 |
| `src/update/consent.ts` | 下载／安装的 Electron 是／否对话框适配 |
| `src/update/consent-handler.ts` | 状态 → 提示编排（纯函数，可测） |
| `src/update/consent-copy.ts` | 对话框标题与正文（纯函数） |
| `src/update/feed-url.ts` | Feed URL／GitHub provider 配置（纯函数） |
| `src/update/policy.ts` | 是否在启动时检查（纯函数） |
| `src/update/state.ts` | 更新生命周期状态机（纯函数） |
| `src/update/version-compare.ts` | 版本比较（纯函数） |

| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、首次欢迎条 |
| `src/shell/pages.ts` | 加载／超时／失败页的纯 HTML 构建 |
| `src/shell/first-run-state.ts` | 在 userData 读写 `hasCompletedFirstLaunch` |
| `src/host/supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host/launcher.ts` | 解析打包 `run-host.mjs`／构建产物／源码三种 `dsh` 启动参数 |
| `src/host/missing-node.ts` | 缺少 Node 的纯检测与中文产品文案 |
| `src/host/parse-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/host/resolve-root.ts` | Host 根：环境变量、打包 `resources/host`、monorepo 上溯 |
| `electron-builder.yml` | Windows / macOS / Linux 打包目标 |
| `scripts/ensure-host-dist.mjs` | 在 electron-builder 前暂存 `host-dist/`（产物或占位） |
| `scripts/stage-host-dist-lib.mjs` | 暂存助手与 `run-host.mjs` 模板（单测覆盖） |

## 本包不做

- 安装包流水线／签名 CI（另项工作）
- 更新提示的客户端 UI（本骨架仅日志 + controller）
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
pnpm --filter @deepseek-ai/dsh-desktop run build
```

## 架构：MVP-A 与 MVP-B

| 阶段 | 载体 | 产品效果 |
|---|---|---|
| **MVP-A**（本包） | 回环 HTTP：在 `127.0.0.1` 上以操作系统分配端口拉起 `dsh web`；解析就绪 URL；`BrowserWindow.loadURL` | Host 与 client 原样复用；以最小壳代码提供首个桌面入口 |
| **MVP-B**（规划中） | `file://` 渲染进程 + 经 Electron IPC 的 `IpcApiClient` | 产品路径不再依赖 `dsh-host-webserver` HTTP 载体；同一 client 栈换用不同传输 |

MVP-A 默认：选用 Electron（而非 Tauri），以便在树内监护 Node Cordis Host；桌面 `DSH_HOME` 位于 `userData`；渲染进程开启 `contextIsolation`、关闭 `nodeIntegration`、开启 sandbox。

设计理由、备选方案与验收标准见 [desktop Electron MVP Agent Note](../../.agents/notes/proposed/architecture/2026-08-19-dsh-desktop-electron-mvp.md)。

## 安全说明

- 在 MVP-B 去掉回环 HTTP 面之前，Host **仅绑定 `127.0.0.1`**。
- 渲染进程隔离：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。壳层不另建凭据模型。
- `openExternal`（preload → main）默认仅允许**绝对 http(s)**（任意主机）。非 http(s) scheme（`file:`、`javascript:`、`data:` 等）一律拒绝。设置 `DSH_DESKTOP_OPEN_EXTERNAL_HOSTS` 为逗号分隔主机名列表后，仅允许列表中的主机**以及 localhost**（`localhost`、`127.0.0.1`、`::1`、`*.localhost`）。
- Host 日志仅作主进程诊断；不要有意在窗口中暴露密钥。
- 关闭应用会停止 Host 子进程，使回环端口不会长于产品窗口存活。
- 安装包通过 `ensure-host-dist` 暂存 Host 产物（优先同机 monorepo 桥接）；仍需要系统 `node`。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、就绪后重启 |
| `src/host/supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程树 |
| `src/host/restart-policy.ts` | 纯函数重启／退避策略 |
| `src/host/log-ring.ts` | 有界 Host 日志 ring（崩溃上下文） |
| `src/host/ready-timeout.ts` | 解析 `DSH_DESKTOP_HOST_READY_MS` |
| `src/host/launcher.ts` | 解析打包 `run-host.mjs`／构建产物／源码三种 `dsh` 启动参数 |
| `src/host/missing-node.ts` | 缺少 Node 的纯检测与中文产品文案 |
| `src/host/parse-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/preload.ts` | 沙箱 preload，暴露 `window.dshDesktop` 壳层 API |
| `src/shell/ipc-channels.json` | IPC 通道名单一来源；main 以 ESM 导入，preload 打包内联以适配 `sandbox: true` |
| `src/shell/bridge.ts` | preload 桥的主进程 IPC 处理 |
| `src/shell/external-url.ts` | `openExternal` 的 http(s) + 可选主机白名单 |
| `src/shell/pages.ts` | 品牌化加载／错误页 HTML；首次欢迎脚本；`describeHostLaunchError` |
| `src/host/resolve-root.ts` | 从包路径定位 monorepo 根目录 |
| `src/smoke/host.ts` | 无界面 Host 就绪冒烟（不打开 Electron GUI） |
| `scripts/smoke-electron.mjs` | Electron 二进制存在性／`--version` 冒烟（不打开窗口） |

| `scripts/smoke-electron.mjs` | 真实 Electron 主进程启动冒烟 |

## 无界面 Host 冒烟

需要快速确认桌面 Host 启动路径能拉起并提供 HTTP、又不想打开 Electron 时使用。**不需要** `DEEPSEEK_API_KEY`。

在仓库根目录（推荐）：

```sh
pnpm run desktop:smoke
```

或在本包：

```sh
pnpm --filter @deepseek-ai/dsh-desktop run smoke:host
```

脚本会构建本包，按与 Electron 主进程相同的方式启动 Host（`resolveHostRoot` + `resolveHostLaunch` + `startHost`），等待 `dsh web:` 就绪 URL，对该 URL 发 `GET`（期望 HTTP 200），停止 Host，成功退出码 `0`、失败 `1`。临时 `DSH_HOME` 放在系统临时目录，避免污染开发者 CLI home。

若要接近生产式 Host（已构建 CLI + Web 前端），先在仓库根目录执行 `pnpm run build`。没有构建产物时，冒烟会与桌面开发一样回退到经 `tsx` 的源码 CLI。CI 门禁使用该源码回退路径，因此不要求完整 monorepo 构建。

## Electron 二进制冒烟

确认 `electron` 包二进制已在磁盘上且能响应 `--version`。不打开窗口，也不启动 Host。

```sh
pnpm --filter @deepseek-ai/dsh-desktop run smoke:electron
```

退出码：`0` 成功，`1` 二进制存在但执行失败，`2` 二进制缺失（常见于 postinstall 下载失败）。CI 仅对退出码 `2` 软失败；二进制损坏仍会使任务失败。

## Electron 主进程冒烟

单元测试不会加载 Electron 主进程。用此门禁在打包前捕获主进程加载崩溃（例如对 CJS 的 `electron-updater` 使用 named import）：

```sh
pnpm run desktop:smoke:electron
```

或：

```sh
pnpm --filter @deepseek-ai/dsh-desktop run smoke:electron
```

脚本在缺少 `lib/main.js` 时会先构建本包，再用真实 Electron 二进制启动本包并监视 stdout/stderr。**成功：** 出现 `dsh web: http://…` Host 就绪行，或无崩溃的 `[auto-update]` feed／start-check 日志（主进程已加载）。**失败（退出码 1）：** `App threw an error`、`Named export`、`Uncaught Exception` 等模式。**跳过（退出码 2）：** `DSH_DESKTOP_SMOKE_ELECTRON=0`，或无法安装／找到 Electron 二进制。默认超时约 75s（`DSH_DESKTOP_SMOKE_ELECTRON_MS`）。结束时会杀掉 Electron 与 Host 子进程。若二进制缺失，会尝试运行 `electron/install.js`（尊重 `HTTP(S)_PROXY`，并将 `ELECTRON_MIRROR` 默认指向 npmmirror）。

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体（MVP-B；见上方 Agent Note）
- 业务 UI（位于 `packages/client/*`）
- IDE 编辑器、云端多租户、VS Code 扩展

## CI

桌面相关有两条工作流：

| 工作流 | 文件 | 作用 |
|---|---|---|
| **Desktop Smoke** | [`.github/workflows/desktop-smoke.yml`](../../.github/workflows/desktop-smoke.yml) | PR／推送路径过滤门禁 |
| **Release (Desktop)** | [`.github/workflows/desktop-release.yml`](../../.github/workflows/desktop-release.yml) | 标签／手动发布构建 + 相同门禁 + 产物上传 |

### Desktop Smoke（PR／master）

**触发：** 触及 `apps/desktop/**`、桌面工作流文件或 workspace 锁文件的 pull request 与推送到 `master`；也可 **workflow_dispatch**。

**矩阵：** **windows-latest** 与 **ubuntu-latest**（必过），**macos-latest**（`continue-on-error`）。

**步骤：**

1. Checkout，配置 pnpm + Node 24，执行 `pnpm install --frozen-lockfile`
2. `pnpm --filter @deepseek-ai/dsh-desktop run build`
3. `pnpm --filter @deepseek-ai/dsh-desktop test`
4. `pnpm --filter @deepseek-ai/dsh-desktop run smoke:host`（无 `apps/cli/lib` 时经 `tsx` 走源码 CLI）
5. `pnpm --filter @deepseek-ai/dsh-desktop run smoke:electron`（仅当退出码为 `2`／二进制缺失时软失败）

### Release (Desktop)

**触发条件：**

| 事件 | 时机 |
|---|---|
| 推送标签 | 匹配 `desktop-v*` 的标签（例如 `desktop-v0.1.0`） |
| 手动 | Actions → **Release (Desktop)** → **Run workflow** |

**工作流当前会做什么：**

1. 与 Desktop Smoke 相同的 install／build／单测／`smoke:host`／`smoke:electron` 序列
2. 将 `apps/desktop/lib/**` 与 `apps/desktop/package.json` 上传为运行产物

矩阵：**windows-latest**（必过）与 **macos-latest**（在打包／签名就绪前使用 `continue-on-error`）。

### 发布清单（维护者）

1. 将桌面相关改动合入集成分支；确认 **Desktop Smoke**（或本地单测 + 冒烟）为绿色。
2. 创建并推送附注标签：`git tag -a desktop-vX.Y.Z -m "desktop vX.Y.Z"`，再 `git push origin desktop-vX.Y.Z`。
3. 打开该标签对应的 **Release (Desktop)** 运行记录；确认 Windows 为绿色（macOS 仍可能是实验性的）。
4. 从该次运行下载上传的产物。当前仅为编译后的主进程 JS，不是面向最终用户的安装包。
5. **TODO：** 扩展发布工作流中的打包步骤，运行 `electron-builder`，并在同一标签运行中发布已签名安装包。

### 当前 CI 范围之外

- 每次桌面门禁都做完整 monorepo 的 `pnpm run build`（Host／前端；Host 冒烟使用源码 CLI 回退）
- 作为必过项的 electron-builder 安装包产物、代码签名、Apple 公证、自动更新通道
- 完整 Electron GUI／BrowserWindow 集成测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
pnpm --filter @deepseek-ai/dsh-desktop run smoke:host
pnpm --filter @deepseek-ai/dsh-desktop run smoke:electron
```

单元测试只覆盖启动／URL 解析等纯逻辑。Host 就绪与 Electron 二进制存在性由 CI 通过 `smoke:host` 与 `smoke:electron` 门禁。
