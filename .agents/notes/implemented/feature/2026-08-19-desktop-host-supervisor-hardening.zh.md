# Agent Note: Desktop Host supervisor hardening

Status: implemented

[English](2026-08-19-desktop-host-supervisor-hardening.md) | 中文

## Problem

MVP-A 桌面壳只启动一次 `dsh web`，并在退出时停止子进程。Host 在就绪后崩溃会留下死窗口；就绪超时是写死常量；停止只依赖单 PID 信号（Windows 上可能残留孙进程）；崩溃对话框也没有有界的近期日志尾部。

## Decision

`apps/desktop` 在不把业务 UI 迁入 Electron 的前提下加固 Host 监管：

1. **就绪后重启** — `main.ts` 在 Host 就绪后监听意外退出，使用 `host-restart-policy.ts` 中的纯策略（默认最多 5 次、1s 起指数 ×2、上限 30s），退避期间展示状态页，经 `startHost` 重新拉起，并在新 URL 上重载 BrowserWindow。主动退出不重启。再次就绪成功会清零失败计数。
2. **可配置就绪超时** — `host-ready-timeout.ts` 读取 `DSH_DESKTOP_HOST_READY_MS`（正整数毫秒）；非法或缺失时回退 120_000。
3. **有界日志 ring** — `host-log-ring.ts` 以固定容量（默认 400 行）保存日志，供崩溃对话框与就绪失败尾部使用；监管器不再无限增长输出字符串。
4. **更强停止** — `host-supervisor.ts` 仍跨平台使用 SIGTERM 后 SIGKILL；在 Windows 上额外执行 `taskkill /T`（随后 `/F`），避免孙进程树残留。

纯策略、ring 与超时解析在 `apps/desktop/tests` 下有单元测试。

## Alternatives considered

- **不重启（仅手动重开应用）** — 更简单，但瞬时 Host 崩溃也要整应用重启；不符合桌面可靠性预期，故否决。
- **无限重启** — 可能掩盖永久性 Host 故障并拖垮机器；改为有上限的失败 streak。
- **壳内落盘滚动日志** — 后续支持包场景有用，暂缓；内存 ring 已够崩溃对话框，并避免 MVP 绑定文件系统。

## Consequences

- 在尝试预算内，桌面可从就绪后 Host 崩溃恢复；预算耗尽时弹出带 ring 尾部的对话框。
- 运维可在不重编的情况下拉长慢启动的就绪等待。
- Windows 停止更激进（整树结束）；若将来 Electron 与 Host 共享进程组，误杀仍是残留风险——当前 Host 以非 detached 直属子进程拉起。
- 策略默认值以模块常量存在便于测试；除就绪超时外的产品旋钮在设置面出现前仍为代码默认。
