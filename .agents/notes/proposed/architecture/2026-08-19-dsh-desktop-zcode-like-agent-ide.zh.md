# Agent Note: DSH Desktop as a Zcode-like Agent IDE

Status: proposed

[English](2026-08-19-dsh-desktop-zcode-like-agent-ide.md) | 中文

## Problem

[Desktop Electron 壳（MVP-A）](2026-08-19-dsh-desktop-electron-mvp.md) 已能以可安装窗口承载既有 `dsh web` Host 与 `packages/client/*` UI。作为产品叙事，这必要但不充分：用户仍首先遇到**以聊天为中心的 Web 布局**，而不是以任务、工作区、权限模式与模型为一级对象的**本地 Agent IDE**。

对等产品（仅依据产品截图归纳信息架构，不逆向其源码）在半分钟内建立预期：左侧任务导航、无需翻菜单即可开工的首页空态、带 Git 与 Goal/Progress 的任务时间线、远程工作区入口（SSH / WSL / Docker）、显式权限模式、命令面板，以及纵深设置信息架构。若缺少刻意的产品地图，Desktop 工作会滑向壳层打磨与聊天装饰，而这些入口面仍会碎片化或缺失。

本注记是该 Agent IDE 方向的产品与包映射。它不取代 Electron 监管决策；它约束被监管 UI 必须长成什么，以及首批交付明确不做的内容。

## Proposal

### One-sentence product

**DSH Desktop 是本地 Agent IDE：工作单元是绑定工作区、权限模式与模型的任务**——而不是包在不透明 agent 外的聊天套壳。

### 借鉴，不照抄（硬约束）

对等产品（Zcode 等）只作**信息架构与工作流透镜**，不是视觉或品牌模板。

| 可借鉴 | 不要抄 |
| --- | --- |
| 一级对象：任务 × 工作区 × 权限 × 模型 | Zcode logo、字标、紫光营销壳 |
| 左侧栏职责（新建任务、搜索、自动化、插件、项目／任务列表） | 像素级间距、圆角、图标集、空态插画语言 |
| 首页空态任务（问候 → 选项目 → 带模式＋模型的作曲器 → 起步提示） | 原样营销文案、时段口号、卡片措辞 |
| 权限模式的**含义**（先问／自动编辑／计划／完全访问） | 对等产品控件皮或把其商标化模式名当自家身份 |
| 设置纵深与命令面板的**职责** | 「因为 Zcode 这么排」而克隆每一行设置 |
| 远程工作区**入口种类**（本地／SSH／WSL／Docker）作为产品意图 | 专有远程 UI 像素或 bot 通道皮肤 |

**视觉体系仍是 DSH：** 沿用既有 `ui-theme`、字体、密度与 DeepSeek 产品语气。新界面应像连贯的 DSH 桌面，而不是换皮。Mock／PR 若以「与 Zcode 像素一致」为目标应驳回；若以「同一待办任务、DSH 材料」为目标可通过。

实现者可读对等产品截图只为**结构**。禁止把已安装对等产品的专有包体、资源或 CSS 解包拷入本仓库。

### Relationship to MVP-A shell

| Layer | Owns | Does not own |
| --- | --- | --- |
| **Desktop shell**（`apps/desktop`） | Electron 窗口、Host 拉起／就绪／停止／重启、`userData` 下的 `DSH_HOME`、单实例聚焦，以及后续安装包／自动更新 | agent loop、工具、会话、权限策略、业务 UI 组件 |
| **Host**（`dsh web` + 核心包） | 会话日志、agent loop、工具、沙箱 × 审批、投影、设置／凭证、工作区物化，以及交付后的远程工作区后端 | 像素布局、React 树、左侧栏装饰 |
| **Client UI**（`packages/client/*`） | AppFrame、侧栏、会话／首页、设置、作曲器控件、任务／目标／计划面 | 进程生命周期、OS 窗口、安装程序 |

业务 UI 仍在 `packages/client/*` 下以插件组合。[壳层注记](2026-08-19-dsh-desktop-electron-mvp.md) 中 shell 仍是监管程序。「像 Zcode 首页」的产品工作几乎全部落在 Host + client 组合与 slot 内容，而不是 Electron 内第二套 UI。

### Information architecture (target)

以下 IA 是依据对等产品截图得到的产品目标。括号内为 DSH 已有词汇。

#### Left rail

- **New Task** — 启动空白任务／会话意图（今日：经 `ui-sidebar` + runtime 会话意图的 New Session）。
- **Search** — 查找任务／会话与内容（今日：`ui-workspace` 中的工作区浏览器搜索）。
- **Automation** — 定时或事件驱动的 agent 运行（未交付；见裁切）。
- **Plugin Market** — 发现／安装插件与扩展（未交付；设置中的插件清单是只读部署真值，不是市场）。
- **Project / task lists** — 工作区及其会话／任务（`sidebar.workspaces` 中的 `ui-workspace`）。
- **Account** — 轨底或设置入口的身份／登录能力（早期裁切为本地优先的最小占位）。

折叠轨在既有 56px layout rail（`ui-layout` + `ui-sidebar`）上以图标控件保留主操作。

#### Home empty state

未选中任务（或处于空白 New Task 页）时：

- 问候与简短产品导向。
- 可选的模型／能力横幅（凭证或路由就绪——与 `ui-settings-models` 引导及 `ui-model-selection` 的 routable 状态组合）。
- **项目／工作区选择器**（经 `ui-workspace` 的 `conversation.hero.workspace`）。
- **作曲器**，带 **权限模式** + **模型** 座位（`ui-conversation` 的 Access／`PermissionSelect`、`ui-permission-presets`、`conversation.input.model`／`ui-model-selection`）。
- 起始提示（填入作曲器的本地化提示芯片；在 Host 模板 API 出现前可为纯 client）。
- 模板卡片（任务模板／配方；靠后——不阻塞 MVP-P0）。

首页是同一会话壳在「无会话／空白会话」姿态下的呈现，不是独立营销小应用。空态内容填入 `conversation.empty` 与 hero slot，而不是分叉 AppFrame。

#### Task view

活跃任务／会话展示：

- **Timeline** — 聊天／工具 transcript（`ui-conversation` + `ui-tool`）；可选 Trajectory 标签（`ui-trajectory`）供事件账本重度用户。
- **Git tools** — 作为 Host 工具 + 工具卡片的 status、diff、commit／PR 辅助（扩展工具呈现；P0 不嵌入完整 IDE diff 编辑器）。
- **Goal / Progress** — 持久目标条与 todo／计划进度（`ui-goal`、`ui-conversation` 中的 todo dock、计划模式开启时的 `ui-plan` 芯片）。

详情列（`ui-layout` 的 `details`）仍用于工具检视与稠密侧栏内容；理解「agent 在做什么」不得依赖必须打开详情列。

#### Remote workspace wizard

一等入口以挂接「不只是本地选文件夹」的工作区：

- **SSH** 远程项目根。
- **WSL** 发行版路径（Windows）。
- **Docker**／类 dev-container 工作区。

P0 仅保留**本地目录**选择器（`ui-directory-picker-native`／browse）。远程模式是 Host 工作区提供方问题，外加工作区添加流中的向导 UI；不是绕过 Host 工作区身份的 Electron main 技巧。

#### Permission modes

对等产品暴露 **ask-before-edit**、**auto-edit**、**plan**、**full-access** 等模式。DSH 已将机制旋钮与产品文案分离：

| Peer label (IA) | DSH mapping (shipped or planned) |
| --- | --- |
| ask-before-edit | 默认安全 preset 方向：约束沙箱 + 审批 `ask`（今日最接近的已交付 preset 为 `workspace-write` 捆绑） |
| auto-edit | 工作区范围写入且减少提示（新建或重命名的 preset 捆绑；仍非环境级全盘） |
| plan | **计划模式**（`dsh-plan-mode` + `ui-plan`）——偏设计／只读循环，不是沙箱别名 |
| full-access | `danger-full-access`，需显式风险确认（`ui-permission-presets`／作曲器模态框） |

作曲器与设置必须展示**人类可读标签与一行后果**，而不仅是 kebab-case preset 键。Plan 是权限旁的模式芯片，不是未经设计就把第四个对等词塞进 `PresetSpec` 的沙箱值。

#### Command palette

**Ctrl+K**（及平台等价键）打开覆盖命令、任务／会话、工作区与设置导航的面板。

建立在 `ui-commands` + `ui-input-trigger` 的 slash 发现之上，而不是一次性的 Electron 菜单。面板是全局装饰；`/` 仍在作曲器内。确切快捷键绑定与焦点恢复属于 `ui-layout`／会话装饰中的 client 壳层工作。

#### Settings IA

目标设置导航（功能包自行注册 section／row；shell 保持哑组合，见[设置组合](2026-07-25-client-settings-locale-theme.md)）：

| Section | Primary owner packages (existing unless noted) |
| --- | --- |
| General | `ui-settings-general` + general items（权限默认、语言、忙碌时 Enter、打开配置文件等） |
| Appearance | `ui-theme` |
| Models | `ui-settings-models` |
| Browser | 未来功能包（浏览器工具策略／允许列表） |
| Memory | 未来（memory 提供方偏好） |
| Subagents | 靠近 `ui-subagent`／agent 组合呈现；初期可紧邻 Agent presets（`ui-agent-preset`） |
| Plugins | `ui-settings-plugins` + `ui-settings-plugin-inventory` |
| MCP | Host MCP 配置 + 新设置 section／卡片 |
| Skills | skill 发现偏好；调用路径仍为 `ui-skill` |
| Commands | 命令可见性／自定义命令入口（扩展命令域） |
| Hooks | hooks 桥接配置 |
| Index | 在 Host index 存在时的代码索引／检索偏好 |
| Usage | token／费用用量视图（投影已供给统计；专用页靠后） |

缺失 section 保持为空 slot，不做假页面。不要在 `apps/desktop` 内发明第二棵设置树。

#### Automation and idle tasks

- **Automation**：cron 或事件触发的任务，在轨中有独立列表入口。
- **Idle tasks**：不占用主时间线焦点的后台／空闲 agent（`ui-jobs` 是后台 job 可见性的种子；完整自动化产品靠后）。

#### Mobile remote control (later phase)

对运行中 Desktop Host 的 QR 配对与机器人渠道远程控制**明确靠后**。它们不得塑造 P0 导航或安全主张。设计时 Host 仍是权威；移动端是远程客户端，不是第二个 agent loop。

### Mapping to existing `packages/client/*`

| Product surface | Package(s) | Gap vs target IA |
| --- | --- | --- |
| AppFrame／分栏／轨宽 | `ui-layout` | 首页空态组合打磨；面板宿主装饰 |
| 左侧轨装饰、New Task | `ui-sidebar` | 文案／命名靠向 Task；Automation／Market 入口 |
| 工作区 + 任务列表 + 搜索 | `ui-workspace` | 远程向导；任务导向文案；起始密度 |
| 首页／transcript／作曲器壳 | `ui-conversation` | 起始提示；模板卡片；Git 时间线密度 |
| 模型座位 | `ui-model-selection` | 与首页横幅集成 |
| 权限座位 | `ui-permission-presets`（+ Host `dsh-permission-presets`） | 对等风格标签；auto-edit preset 设计 |
| 计划芯片 | `ui-plan` | 与权限保持区分 |
| 目标／进度 | `ui-goal` + todo dock | 进度叙事包装 |
| 命令／slash | `ui-commands`、`ui-input-trigger` | Ctrl+K 面板 |
| Skills | `ui-skill` | 设置 section 靠后 |
| Subagents | `ui-subagent` | 设置 IA 入口 |
| 设置壳 | `ui-settings`、`ui-settings-general` | section 清单扩展 |
| 模型设置／引导 | `ui-settings-models` | 首页横幅复用 |
| 插件设置 | `ui-settings-plugins`、`ui-settings-plugin-inventory` | Market 是独立产品 |
| Agent presets | `ui-agent-preset` | 后续与 Automation 相邻 |
| Trajectory | `ui-trajectory` | 强力标签，非默认首页 |
| Jobs | `ui-jobs` | 空闲／自动化可见性种子 |
| 目录选择 | `ui-directory-picker-native`／`browse` | 在远程提供方出现前仅本地 |
| 主题／语言 | `ui-theme`、`locale` | Appearance／General 行 |
| Web 内核 | `web`、`web-react`、`runtime`、`modules`、`connection` | 仅组合 |

新产品行为以 slot 贡献与 Host 投影／命令落地，而不是 `packages/client/ui-zcode` 式整树分叉。

### MVP cuts (ruthless)

#### MVP-P0 — “Agent IDE home in 30 seconds”

须在 Desktop 上一起交付（shell 可已存在）：

1. **可安装／本地 Desktop 入口**，打开 Host + client（[shell](2026-08-19-dsh-desktop-electron-mvp.md) + 可用范围内的打包）。
2. **左侧轨**：New Task、工作区／任务列表、搜索、设置入口；可折叠为图标轨。
3. **首页空态**：问候、工作区选择器、带 **权限** + **模型** 的作曲器，至少三条起始提示。
4. **任务时间线**，含流式聊天／工具卡片，并在存在时显示 **Goal 或 todo 进度**。
5. **权限**安全默认 + 经确认的 **full-access**；可从作曲器／命令进入 **计划模式**。
6. 仅 **本地工作区** 添加／选择（native 或 browse）。
7. 首次运行即可找到 **Models** 路径（引导或 设置 → Models），使首页作曲器可路由。
8. 为重度用户提供 **slash 命令**；若 `/` 与设置搜索已覆盖演示路径，Ctrl+K 可先做薄实现——若成本留在 client 装饰内，优先交付面板壳。

#### MVP-P1 — deepen the IDE loop

- 更贴近对等产品的 **权限标签**，以及与沙箱 × 审批对齐的 **auto-edit** preset 叙事。
- **Git** 工具卡片，以及任务头或详情中的轻量 status 入口。
- 覆盖命令、会话与设置 section 的 **命令面板**（Ctrl+K）。
- 填满 **MCP**、更丰富的 **Plugins**，以及只读 **Usage** 等设置 section。
- 任务头中的 **subagent** 目录可发现性（已有种子）+ 设置指针。
- 若工程成本迫使排序，远程工作区优先 **WSL**（Windows），再做通用 SSH。

#### Later

- SSH + Docker 远程工作区向导完整性。
- Automation 轨 + 空闲任务产品。
- 插件 **Market**（发现／安装），与部署清单区分。
- Memory／Browser／Hooks／Index 设置纵深。
- 移动端远程控制（QR／机器人）。
- 完整 IDE 编辑器、多租户云控制面、VS Code 扩展宿主。

### Desktop shell vs Host vs client (recap)

```text
┌─────────────────────────────────────────────┐
│ apps/desktop (Electron main)                │
│  window · tray/focus · Host supervisor      │
│  userData DSH_HOME · update consent later   │
└─────────────────┬───────────────────────────┘
                  │ spawn loopback Host
┌─────────────────▼───────────────────────────┐
│ Host (dsh web / Cordis)                     │
│  sessions · tools · sandbox × approval      │
│  projections · settings · workspaces        │
└─────────────────┬───────────────────────────┘
                  │ RPC + event stream
┌─────────────────▼───────────────────────────┐
│ packages/client/* (Agent IDE UI)            │
│  layout · rail · home · task · settings     │
└─────────────────────────────────────────────┘
```

**规则：** 若变更在 Agent IDE IA 中可见且不是窗口生命周期，则属于 Host 与／或 `packages/client/*`。若变更是进程死亡、端口或安装程序，则属于 `apps/desktop`。

## Alternatives considered

### Stay a chat wrapper; only ship the Electron window

否决作为产品终态。仅监管 `dsh web`、却无首页／轨／权限／模型任务语义，会输掉对等产品的「30 秒理解」测试，也低估树内已有 Host 能力（工作区、preset、计划、目标、skill）。

### Rebuild UI inside Electron main/renderer as a separate design system

否决。相对 `packages/client/*` 双倍维护，并破坏 [GUI 分层](../../implemented/architecture/2026-07-19-gui-layering-and-rpc-protocol.md) 方向。Desktop 是壳；IDE 是 client 组合。

### Copy peer preset names into sandbox mode enums

否决。沙箱模式与审批策略仍是机制旋钮；计划模式是独立循环模式。产品标签映射到 preset + plan，不把四个对等词压成一个枚举。

### Make Plugin Market and Automation P0

否决。它们在核心任务循环变清楚之前放大信任、分发与调度表面积。清单与 jobs 仍是诚实的 P0／P1 种子。

### Lead with remote workspaces before local home polish

否决。本地文件夹 + 清晰的权限／模型路径是桌面默认叙事；若首页仍是空白聊天，远程向导价值虽高仍输掉 30 秒测试。

## Acceptance criteria

### Feels like Zcode home in 30 seconds

Desktop 冷启动新用户、无 CLI 知识时：

1. 在正常本地启动时间内看到**具名桌面应用**窗口（而非裸终端）。
2. **首屏绘制后 30 秒内**能指出：**如何开始任务**、**项目／任务在哪**、**在哪选模型**，以及**当前权限模式有多危险**。
3. 能绑定**本地工作区**、发出首条提示，并在不打开设置的情况下看到 agent 工作的**时间线**。
4. 能从作曲器切换**权限模式**与**模型**，而不仅依赖 slash 发现。
5. 能打开**设置**并在无文档情况下找到 **Models** 与 **General**。
6. 完成以上路径无需被告知「这只是 `dsh web` 上的 Chromium」——实现仍可以是该栈，产品 IA 不得读起来像未完成的聊天调试面。

### Engineering acceptance (P0)

- 不在 `apps/desktop` 下引入业务 UI 包。
- 首页／轨／作曲器工作落在 `packages/client/*`（仅在投影／命令／preset 需要时触及 Host）。
- 沙箱 × 审批与计划模式语义仍以 Host 为权威；client 展示标签并触发既有命令／RPC。
- 本注记保持被 Desktop 产品规划引用；仅壳层注记不得静默把产品重定义为纯聊天。

## Risks

- **Preset 词汇错位** — 对等标签暗示四种模式；DSH 交付两个默认 preset + plan。用文案与刻意的 P1 preset 表变更缓解，不做临时 client 谎言。
- **范围滑向编辑器／云** — 此处「IDE」指 agent 任务 IDE，不是 VS Code 替代品。Later 清单保持强硬。
- **远程工作区安全** — SSH／Docker 凭证与文件系统权威须经 Host 中介；shell 不得持有并行信任模型。
- **过渡期双重 IA** — 在 API 重命名前，Session 与 Task 文案会漂移；优先 UI 文案，持久 API 重命名走独立变更。
- **面板与 slash 重复** — 两个发现面可能腐烂；面板应调用与 `ui-commands` 相同的命令目录。
