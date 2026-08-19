/** `commandPalette` namespace dictionaries. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'palette.title': '命令面板',
  'palette.placeholder': '搜索命令、任务或文件…',
  'palette.empty': '无匹配结果',
  'palette.openHint': '打开命令面板',
  'filter.all': '全部',
  'filter.actions': '操作',
  'filter.tasks': '任务',
  'filter.files': '文件',
  'action.newTask.title': '新建任务',
  'action.newTask.description': '开始一个新会话',
  'action.openWorkspace.title': '打开工作区',
  'action.openWorkspace.description': '打开或创建工作区',
  'action.settings.title': '设置',
  'action.settings.description': '打开设置',
  'action.toggleSidebar.title': '切换侧边栏',
  'action.toggleSidebar.description': '折叠或展开左侧栏',
} satisfies Record<string, string>

/** The commandPalette namespace key union. */
export type CommandPaletteKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'palette.title': 'Command palette',
  'palette.placeholder': 'Search commands, tasks, or files…',
  'palette.empty': 'No matching results',
  'palette.openHint': 'Open command palette',
  'filter.all': 'All',
  'filter.actions': 'Actions',
  'filter.tasks': 'Tasks',
  'filter.files': 'Files',
  'action.newTask.title': 'New task',
  'action.newTask.description': 'Start a new session',
  'action.openWorkspace.title': 'Open workspace',
  'action.openWorkspace.description': 'Open or create a workspace',
  'action.settings.title': 'Settings',
  'action.settings.description': 'Open settings',
  'action.toggleSidebar.title': 'Toggle sidebar',
  'action.toggleSidebar.description': 'Collapse or expand the left rail',
} satisfies Record<CommandPaletteKey, string>
