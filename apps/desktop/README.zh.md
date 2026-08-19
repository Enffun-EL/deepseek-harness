# `@deepseek-ai/dsh-desktop`

[English](README.md) | 中文

**DSH Desktop** 的 Electron 壳（MVP-A）。主进程在回环地址启动本地 `dsh web` Host（`127.0.0.1`、由操作系统分配端口），等待 `dsh web:` 就绪行，并在 `BrowserWindow` 中加载该 URL。Agent 循环、工具、会话与聊天 UI 仍由现有 Host 与 `packages/client/*` 承担。

沙箱 **preload 壳桥** 通过 `window.dshDesktop` 暴露最小能力（`getShellInfo`、仅 http(s) 的 `openExternal`）。该 API **只服务壳层 chrome**，不是 Host API / ApiClient 的替代；Agent 与会话流量仍走回环 Host，MVP-B 可能另加 IPC 载体。

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

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host |
| `src/preload.ts` | 沙箱 preload（CJS 构建）：`contextBridge` → `window.dshDesktop` |
| `src/shell-ipc.ts` | 共享 IPC 通道名与 shell-info 载荷类型 |
| `src/shell-bridge.ts` | 壳桥主进程 IPC 处理器 |
| `src/external-url.ts` | `openExternal` 的 http(s) 白名单纯函数 |
| `src/dsh-desktop.d.ts` | `Window.dshDesktop` 环境类型 |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-repo-root.ts` | 从包路径定位 monorepo 根目录 |

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体／完整 Host ApiClient 经 preload（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）
- 用 `window.dshDesktop` 替代回环 Host 的 HTTP／WebSocket API

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
