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

## 本包不做

- 安装包／自动更新（后续功能）
- IPC `file://` 载体（MVP-B；见桌面架构 Agent Note）
- 业务 UI（位于 `packages/client/*`）

## 测试

```sh
pnpm --filter @deepseek-ai/dsh-desktop test
```

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
