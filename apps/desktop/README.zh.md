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

### Host 可靠性

- Host 在打印就绪 URL 之后若意外退出，主进程按上限做指数退避重启，成功后窗口重新加载新 URL。
- 就绪等待默认 120s，可用环境变量 `DSH_DESKTOP_HOST_READY_MS`（正整数毫秒）覆盖。
- Host 的 stdout/stderr 写入有界内存 ring，供崩溃对话框展示近期日志，避免无界缓冲。
- 停止路径跨平台（`SIGTERM` 后 `SIGKILL`）；在 Windows 上额外使用 `taskkill /T`，避免孙进程残留。

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
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```
