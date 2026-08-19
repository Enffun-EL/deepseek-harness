/** `pluginMarket` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'pluginMarket'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  title: '插件市场',
  search: '搜索插件',
  installed: '已安装',
  installedEmpty: '暂无已安装插件。',
  installedEmptySearch: '没有匹配的已安装插件。',
  catalogEmptySearch: '没有匹配的插件。',
  createPlugin: '创建插件',
  version: '版本 {version}',
} as const

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<PluginMarketKey, string> = {
  title: 'Plugin market',
  search: 'Search plugins',
  installed: 'Installed',
  installedEmpty: 'No installed plugins yet.',
  installedEmptySearch: 'No matching installed plugins.',
  catalogEmptySearch: 'No matching plugins.',
  createPlugin: 'Create plugin',
  version: 'Version {version}',
}

/** Key domain of the `pluginMarket` namespace (zh is the source of truth). */
export type PluginMarketKey = keyof typeof zh
