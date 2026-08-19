/**
 * Pure helpers for detecting a missing system Node binary and Chinese product copy.
 * Free of Electron imports so shell pages and unit tests can share the same messages.
 * @module @deepseek-ai/dsh-desktop/missing-node
 */

/** Chinese product message when system Node cannot be spawned. */
export const MISSING_NODE_MESSAGE_ZH =
  '未找到可用的 Node.js。DSH Desktop 需要系统安装 Node.js（^22.19 或 >=24）才能启动本地 Host。请安装 Node 并确保 `node` 在 PATH 中，或设置环境变量 NODE / npm_node_execpath 指向 Node 可执行文件。'

/**
 * True when an error looks like the OS could not find the Node executable.
 * Matches spawn ENOENT and common “node is not recognized” wording.
 * @param error - thrown value from spawn / supervisor
 */
export function isMissingNodeError(error: unknown): boolean {
  if (error === null || error === undefined) return false
  if (typeof error === 'object') {
    const code = 'code' in error ? error.code : undefined
    if (code === 'ENOENT') {
      const syscall = 'syscall' in error ? error.syscall : undefined
      const pathValue = 'path' in error ? error.path : undefined
      // Prefer spawn-of-node; still accept bare ENOENT when message mentions node.
      if (syscall === 'spawn' || syscall === 'spawnSync') {
        if (typeof pathValue === 'string' && /node/i.test(pathValue)) return true
        const message = error instanceof Error ? error.message : String(error)
        if (/node/i.test(message)) return true
      }
    }
  }
  const message = error instanceof Error ? error.message : String(error)
  return isMissingNodeMessage(message)
}

/**
 * True when a free-form message indicates Node is missing from PATH / env.
 * @param message - error or log text
 */
export function isMissingNodeMessage(message: string): boolean {
  if (message.includes(MISSING_NODE_MESSAGE_ZH)) return true
  if (/未找到可用的 Node\.js/u.test(message)) return true
  if (/ENOENT/i.test(message) && /node/i.test(message)) return true
  if (/spawn\s+node\s+ENOENT/i.test(message)) return true
  if (/not recognized as an internal or external command/i.test(message) && /node/i.test(message)) {
    return true
  }
  if (/command not found/i.test(message) && /\bnode\b/i.test(message)) return true
  if (/No such file or directory/i.test(message) && /\bnode\b/i.test(message)) return true
  return false
}

/**
 * Map an unknown Host start error to Chinese detail when Node is missing.
 * @param error - thrown failure
 * @returns Chinese missing-Node detail, or the original message
 */
export function formatHostStartErrorDetail(error: unknown): string {
  if (isMissingNodeError(error)) return MISSING_NODE_MESSAGE_ZH
  if (error instanceof Error) return error.message
  return String(error)
}
