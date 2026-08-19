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

## 布局

| 路径 | 职责 |
|---|---|
| `src/main.ts` | Electron 主进程：窗口、单实例、退出时停止 Host |
| `src/host-supervisor.ts` | 拉起 Host、解析就绪 URL、停止子进程 |
| `src/host-launcher.ts` | 解析构建产物／源码两种 `dsh` 启动参数 |
| `src/parse-host-url.ts` | 解析 `dsh web: http://…` 的纯函数 |
| `src/resolve-repo-root.ts` | 从包路径定位 monorepo 根目录 |
| `src/smoke-host.ts` | 无界面 Host 就绪冒烟（不打开 Electron GUI） |

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

脚本会构建本包，按与 Electron 主进程相同的方式启动 Host（`resolveRepoRoot` + `resolveHostLaunch` + `startHost`），等待 `dsh web:` 就绪 URL，对该 URL 发 `GET`（期望 HTTP 200），停止 Host，成功退出码 `0`、失败 `1`。临时 `DSH_HOME` 放在系统临时目录，避免污染开发者 CLI home。

若要接近生产式 Host（已构建 CLI + Web 前端），先在仓库根目录执行 `pnpm run build`。没有构建产物时，冒烟会与桌面开发一样回退到经 `tsx` 的源码 CLI。

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

单元测试只覆盖启动／URL 解析等纯逻辑。Host 就绪检查通过手动（或可选 CI）冒烟 `smoke:host` / `desktop:smoke` 完成。
