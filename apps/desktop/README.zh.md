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

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
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
- Host 日志仅作主进程诊断；不要有意在窗口中暴露密钥。
- 关闭应用会停止 Host 子进程，使回环端口不会长于产品窗口存活。
- 后续安装包必须附带 Host 布局；仅 monorepo 启动仍依赖系统 `node` 与仓库布局。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、就绪后重启 |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程树 |
| `src/host-restart-policy.ts` | 纯函数重启／退避策略 |
| `src/host-log-ring.ts` | 有界 Host 日志 ring（崩溃上下文） |
| `src/host-ready-timeout.ts` | 解析 `DSH_DESKTOP_HOST_READY_MS` |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-repo-root.ts` | 从包路径定位 monorepo 根目录 |

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体（MVP-B；见上方 Agent Note）
- 业务 UI（位于 `packages/client/*`）
- IDE 编辑器、云端多租户、VS Code 扩展

## CI 发布

GitHub Actions 工作流：[`.github/workflows/desktop-release.yml`](../../.github/workflows/desktop-release.yml)。

### 触发条件

| 事件 | 时机 |
|---|---|
| 推送标签 | 匹配 `desktop-v*` 的标签（例如 `desktop-v0.1.0`） |
| 手动 | Actions → **Release (Desktop)** → **Run workflow** |

### 工作流当前会做什么

1. Checkout，配置 pnpm + Node 24，执行 `pnpm install --frozen-lockfile`
2. `pnpm --filter @deepseek-ai/dsh-desktop run build`
3. `pnpm --filter @deepseek-ai/dsh-desktop test`
4. 将 `apps/desktop/lib/**` 与 `apps/desktop/package.json` 上传为运行产物

矩阵：**windows-latest**（必过）与 **macos-latest**（在打包／签名就绪前使用 `continue-on-error`）。

### 发布清单（维护者）

1. 将桌面相关改动合入集成分支，并在本地确认包测试通过。
2. 创建并推送附注标签：`git tag -a desktop-vX.Y.Z -m "desktop vX.Y.Z"`，再 `git push origin desktop-vX.Y.Z`。
3. 打开该标签对应的 **Release (Desktop)** 运行记录；确认 Windows 为绿色（macOS 仍可能是实验性的）。
4. 从该次运行下载上传的产物。当前仅为编译后的主进程 JS，不是面向最终用户的安装包。
5. **TODO：** 当 `apps/desktop` 下具备 `electron-builder`（或等价）配置后，扩展工作流中的打包步骤，并在同一标签运行中发布已签名的安装包。

### 当前 CI 范围之外

- 完整 monorepo 的 `pnpm run build`（Host／前端；桌面包单测不依赖）
- electron-builder 安装包、代码签名、Apple 公证、自动更新通道
