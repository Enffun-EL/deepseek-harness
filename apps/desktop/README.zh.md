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

## 自动更新（骨架）

主进程通过 [`electron-updater`](https://www.electron.build/auto-update) 集成更新，**默认偏安全**：

| 行为 | 默认 |
|---|---|
| 启动时检查 | 仅在应用**已打包**时（`app.isPackaged`）。开发态 `electron .` 不发起网络检查 |
| 手动检查 | `setupAutoUpdate().checkForUpdates()`，供后续菜单项调用 |
| 自动下载 | **关闭**（`autoDownload = false`） |
| 静默安装 | **不会**——只有用户通过 `requestInstallDownloadedUpdate()` 明确同意后才安装 |
| 退出时自动安装 | **关闭**，直到用户对已下载更新给出同意 |

**更新源（占位）：** GitHub Releases，仓库 `Enffun-EL/deepseek-harness`（`provider: github`）。可用环境变量覆盖：

| 变量 | 作用 |
|---|---|
| `DSH_DESKTOP_UPDATE_FEED_URL` | 托管 `latest.yml`／产物的通用 HTTP 目录 |
| `DSH_DESKTOP_UPDATE_GITHUB_OWNER` / `DSH_DESKTOP_UPDATE_GITHUB_REPO` | GitHub Releases 的 owner／repo |
| `DSH_DESKTOP_UPDATE_CHANNEL` | 任一 provider 的 channel |
| `DSH_DESKTOP_UPDATE_CHECK` | `1`／`true` 强制启动检查；`0`／`false`／`off` 关闭 |

### 签名与开发

本骨架**未**配置代码签名与公证。未签名或开发构建可能在校验签名时失败、找不到已发布安装包，或更新器直接 no-op。本地开发如此属预期；生产安装包需在流水线中提供签名产物与真实 publish 配置后，再依赖自动更新。

版本比较、feed URL 构建、更新状态机等纯函数已做单元测试，无需启动 Electron。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、挂载自动更新 |
| `src/auto-update.ts` | electron-updater 接线与需用户同意的控制器 |
| `src/feed-url.ts` | Feed URL／GitHub provider 配置（纯函数） |
| `src/update-policy.ts` | 是否在启动时检查（纯函数） |
| `src/update-state.ts` | 更新生命周期状态机（纯函数） |
| `src/version-compare.ts` | 版本比较（纯函数） |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-repo-root.ts` | 从包路径定位 monorepo 根目录 |

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
