# `@deepseek-ai/dsh-desktop`

[English](README.md) | 中文

**DSH Desktop** 的 Electron 壳（MVP-A）。主进程在回环地址启动本地 `dsh web` Host（`127.0.0.1`、由操作系统分配端口），等待 `dsh web:` 就绪行，并在 `BrowserWindow` 中加载该 URL。Agent 循环、工具、会话与聊天 UI 仍由现有 Host 与 `packages/client/*` 承担。

## 要求

- 在仓库根目录安装依赖（`pnpm install`）
- 生产式运行需要已构建的 Host／前端产物（`pnpm run build`）；开发可走源码启动路径（`tsx` + `pnpm dsh`）
- 系统 `PATH` 上有 `node`（不用 Electron 二进制跑 CLI）

## 开发

在仓库根目录：

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-desktop run build
pnpm desktop
```

`pnpm desktop` 会构建本包并启动 Electron。Host 的 `DSH_HOME` 落在 Electron `userData` 下的 `dsh-home`，避免与开发者 CLI 的 home 互相覆盖。

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

MVP 打包**不会**把完整 monorepo Host 打进安装包。运行时 `resolveHostRoot` 按下列顺序取第一个命中项：

1. **`DSH_DESKTOP_HOST_ROOT`** — 指向含 `apps/cli` 的 Host 根目录（已构建 `lib/bin.js` 和／或源码 `src/bin.ts`）。
2. **`resources/host`** — 可选树，由 electron-builder `extraResources` 从 `apps/desktop/host-dist` 拷入（仅在 pack 前填充 `host-dist` 时存在）。
3. **Monorepo 上溯** — 带 `pnpm-workspace.yaml` 与 `apps/cli` 的父目录（开发检出 / `pnpm desktop`）。

`pnpm run ensure-host-dist`（由 `pack` / `dist` 调用）会创建占位 `host-dist/`，使 electron-builder 的 `extraResources` 源路径存在。该占位**不是**可运行 Host。若要自包含安装包，请在 `dist` 前把准备好的 Host 布局放入 `apps/desktop/host-dist/`（至少包含 `apps/cli/lib/bin.js` 及 CLI 运行时闭包），或说明最终用户需将 `DSH_DESKTOP_HOST_ROOT` 指向已安装的 monorepo／CLI 树。

拉起 Host 仍需要系统 `node`；绝不使用 Electron 的 `process.execPath` 作为 Node 二进制。

### 限制（当前 MVP）

- 安装包内完整捆绑 Host + 前端**延后**；仅 shell 产物只有在能按上文发现 Host 根时才能启动。
- 代码签名、公证与自动更新不在本包范围。
- 不保证在单一 OS 上交叉构建全部目标；优先各平台原生 CI runner。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-host-root.ts` | Host 根：环境变量、打包 `resources/host`、monorepo 上溯 |
| `electron-builder.yml` | Windows / macOS / Linux 打包目标 |
| `scripts/ensure-host-dist.mjs` | 在 electron-builder 前确保 `host-dist/` 存在 |

## 本包不做

- 自动更新／代码签名流水线
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
