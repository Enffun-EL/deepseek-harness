/** `home` namespace dictionaries for the HOME empty-state surface. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'greeting.hello': '你好',
  'greeting.subtitle': '从项目、模板或一句话开始',
  'model.missing.title': '尚未配置模型',
  'model.missing.body': '添加模型凭据后即可开始对话。',
  'model.missing.cta': '配置模型',
  'project.picker': '选择项目',
  'project.picker.open': '打开项目',
  'composer.permission.aria': '权限模式',
  'composer.model.aria': '模型',
  'composer.submit': '发送',
  'composer.placeholder': '描述你想完成的任务…',
  'permission.read-only': '只读',
  'permission.workspace-write': '工作区写入',
  'permission.danger-full-access': '完全访问',
  'starters.title': '试试这些',
  'templates.title': '从模板开始',
  'templates.empty': '暂无模板',
} satisfies Record<string, string>

/** The home namespace key union. */
export type HomeKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'greeting.hello': 'Hello',
  'greeting.subtitle': 'Start from a project, template, or one prompt',
  'model.missing.title': 'No model configured',
  'model.missing.body': 'Add model credentials before starting a conversation.',
  'model.missing.cta': 'Configure model',
  'project.picker': 'Choose project',
  'project.picker.open': 'Open project',
  'composer.permission.aria': 'Permission mode',
  'composer.model.aria': 'Model',
  'composer.submit': 'Send',
  'composer.placeholder': 'Describe what you want to build…',
  'permission.read-only': 'Read only',
  'permission.workspace-write': 'Workspace write',
  'permission.danger-full-access': 'Full access',
  'starters.title': 'Try these',
  'templates.title': 'Start from a template',
  'templates.empty': 'No templates yet',
} satisfies Record<HomeKey, string>

/**
 * Resolve a home dictionary key for the given locale.
 * @param locale - `zh` or any other tag (falls back to English).
 * @param key - dictionary key.
 * @returns the localized string.
 */
export function homeString(locale: string, key: HomeKey): string {
  return (locale === 'zh' || locale.startsWith('zh-') ? zh : en)[key]
}
