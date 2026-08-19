/** `sidebar` namespace dictionaries: shell controls (brand row, New Session, fold toggle, Desktop rail). */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'session.new': '新会话',
  'session.new.label': '新建会话',
  'toggle.open': '打开侧边栏',
  'toggle.collapse': '收起侧边栏',
  // Desktop left-rail chrome (Zcode-like IA); unused while desktopRail is off.
  'rail.nav': '主导航',
  'task.new': '新建任务',
  'task.new.label': '新建任务',
  'nav.search': '搜索',
  'nav.automation': '自动化',
  'nav.pluginMarket': '插件市场',
  'section.projects': '项目',
  'section.tasks': '任务',
  'empty.projects': '尚未打开项目',
  'empty.tasks': '还没有任务',
  'account.connect': '连接使用',
  'account.phoneRemote': '手机远程',
} satisfies Record<string, string>

/** The sidebar namespace key union. */
export type SidebarKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
  'rail.nav': 'Main navigation',
  'task.new': 'New Task',
  'task.new.label': 'New task',
  'nav.search': 'Search',
  'nav.automation': 'Automation',
  'nav.pluginMarket': 'Plugin Market',
  'section.projects': 'Projects',
  'section.tasks': 'Tasks',
  'empty.projects': 'No project open yet',
  'empty.tasks': 'No tasks yet',
  'account.connect': 'Connect',
  'account.phoneRemote': 'Phone remote',
} satisfies Record<SidebarKey, string>
