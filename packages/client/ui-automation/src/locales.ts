/** `automation` namespace dictionaries for the Automation page surface. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'page.title': '自动化',
  'page.subtitle': '在空闲或定时条件下运行代理任务',
  'empty.title': '还没有自动化任务',
  'empty.body': '创建定时任务，或从空闲模板开始。',
  'cta.scheduled': '创建定时任务',
  'cta.idle': '创建空闲任务',
  'keepAwake.label': '保持唤醒',
  'keepAwake.hint': '在自动化需要运行时阻止系统休眠（仅本地开关，尚未接入宿主）。',
  'keepAwake.aria': '保持设备唤醒',
  'section.scheduled': '定时',
  'section.idle': '空闲',
  'section.templates': '空闲模板',
  'templates.empty': '暂无模板',
  'template.gitWeekly.title': 'Git 周报摘要',
  'template.gitWeekly.description': '汇总本周提交、PR 与未合并变更。',
  'template.ciFlaky.title': 'CI 不稳定报告',
  'template.ciFlaky.description': '扫描近期流水线中的 flaky 失败并归类。',
  'template.docsSync.title': '文档同步',
  'template.docsSync.description': '对照代码变更检查文档是否过时并起草更新。',
} satisfies Record<string, string>

/** The automation namespace key union. */
export type AutomationKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'page.title': 'Automation',
  'page.subtitle': 'Run agent tasks on a schedule or when the machine is idle',
  'empty.title': 'No automations yet',
  'empty.body': 'Create a scheduled task, or start from an idle template.',
  'cta.scheduled': 'Create scheduled task',
  'cta.idle': 'Create idle task',
  'keepAwake.label': 'Keep awake',
  'keepAwake.hint': 'Prevent sleep while automations need to run (local toggle only; not host-backed yet).',
  'keepAwake.aria': 'Keep the device awake',
  'section.scheduled': 'Scheduled',
  'section.idle': 'Idle',
  'section.templates': 'Idle templates',
  'templates.empty': 'No templates yet',
  'template.gitWeekly.title': 'Git weekly summary',
  'template.gitWeekly.description': 'Summarize commits, PRs, and unmerged work from this week.',
  'template.ciFlaky.title': 'CI flaky report',
  'template.ciFlaky.description': 'Scan recent pipelines for flaky failures and group them.',
  'template.docsSync.title': 'Docs sync',
  'template.docsSync.description': 'Check docs against code changes and draft updates.',
} satisfies Record<AutomationKey, string>

/**
 * Resolve an automation dictionary key for the given locale.
 * @param locale - `zh` or any other tag (falls back to English).
 * @param key - dictionary key.
 * @returns the localized string.
 */
export function automationString(locale: string, key: AutomationKey): string {
  return (locale === 'zh' || locale.startsWith('zh-') ? zh : en)[key]
}