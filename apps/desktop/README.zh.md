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

## 首次启动与壳层状态页

本地 Host 启动期间，主进程展示品牌化中文**加载页**（data URL）。Host **失败**或**就绪超时**时展示对应错误页，并提供**重试**（停止旧子进程后重新 boot）。页面由 `src/shell-pages.ts` 中的纯函数生成（可单测；不开启 `nodeIntegration`）。

每个配置档案**首次**成功加载 Host Web UI 后，壳层会在页面顶部注入一条简短**欢迎状态条**，不阻断操作并自动消失。完成标记写入 Electron `userData` 下的 `desktop-shell-state.json`（字段 `hasCompletedFirstLaunch`）。之后启动不再显示。状态缺失或损坏视为未完成。

壳层窗口安全不变量保持不变：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host、首次欢迎条 |
| `src/shell-pages.ts` | 加载／超时／失败页的纯 HTML 构建 |
| `src/first-run-state.ts` | 在 userData 读写 `hasCompletedFirstLaunch` |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-repo-root.ts` | 从包路径定位 monorepo 根目录 |

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
