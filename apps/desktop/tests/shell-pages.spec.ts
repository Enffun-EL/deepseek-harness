import { describe, expect, it } from 'vitest'
import {
  buildFirstRunWelcomeScript,
  buildShellPageDataUrl,
  buildShellPageHtml,
  classifyHostStartError,
  describeHostLaunchError,
  escapeHtml,
  FIRST_RUN_WELCOME_MAX_ATTEMPTS,
  isMissingNodeLaunchError,
  MISSING_NODE_DETAIL,
  SHELL_RETRY_URL,
} from '../src/shell-pages.js'

describe('escapeHtml', () => {
  it('escapes markup-significant characters', () => {
    expect(escapeHtml('a&b<c>"d"\'e')).toBe('a&amp;b&lt;c&gt;&quot;d&quot;&#39;e')
  })
})

describe('classifyHostStartError', () => {
  it('detects readiness timeouts', () => {
    expect(
      classifyHostStartError('dsh-desktop: timed out after 120000ms waiting for Host URL'),
    ).toBe('timeout')
  })

  it('treats other messages as failure', () => {
    expect(classifyHostStartError('Host exited before readiness')).toBe('failure')
  })
})

describe('describeHostLaunchError / isMissingNodeLaunchError', () => {
  it('maps spawn node ENOENT to branded Chinese missing-node copy', () => {
    const err = Object.assign(new Error('spawn node ENOENT'), {
      code: 'ENOENT',
      path: 'node',
      syscall: 'spawn',
    })
    expect(isMissingNodeLaunchError(err)).toBe(true)
    const described = describeHostLaunchError(err)
    expect(described.missingNode).toBe(true)
    expect(described.kind).toBe('failure')
    expect(described.detail).toBe(MISSING_NODE_DETAIL)
    expect(described.detail).toContain('Node.js')
  })

  it('maps Windows-style missing node messages', () => {
    expect(
      isMissingNodeLaunchError(
        new Error("'node' is not recognized as an internal or external command"),
      ),
    ).toBe(true)
  })

  it('does not treat unrelated ENOENT as missing node', () => {
    const err = Object.assign(new Error('spawn /missing/cli ENOENT'), {
      code: 'ENOENT',
      path: '/missing/cli',
      syscall: 'spawn',
    })
    expect(isMissingNodeLaunchError(err)).toBe(false)
    const described = describeHostLaunchError(err)
    expect(described.missingNode).toBe(false)
    expect(described.detail).toContain('spawn /missing/cli ENOENT')
  })

  it('keeps timeout classification for readiness waits', () => {
    const described = describeHostLaunchError(
      new Error('dsh-desktop: timed out after 120000ms waiting for Host URL'),
    )
    expect(described.kind).toBe('timeout')
    expect(described.missingNode).toBe(false)
  })
})

describe('buildShellPageHtml', () => {
  it('renders first-launch loading copy without a retry control', () => {
    const html = buildShellPageHtml({ kind: 'loading', isFirstLaunch: true })
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('首次启动')
    expect(html).toContain('正在准备')
    expect(html).toContain('class="spinner"')
    expect(html).not.toContain(SHELL_RETRY_URL)
    expect(html).toContain('role="status"')
  })

  it('renders ordinary loading copy', () => {
    const html = buildShellPageHtml({ kind: 'loading' })
    expect(html).toContain('正在启动本地 Host')
    expect(html).not.toContain('首次启动')
  })

  it('renders timeout page with escaped detail and retry', () => {
    const html = buildShellPageHtml({
      kind: 'timeout',
      detail: 'timed out <script>alert(1)</script>',
      showRetry: true,
    })
    expect(html).toContain('启动超时')
    expect(html).toContain('role="alert"')
    expect(html).toContain(`href="${SHELL_RETRY_URL}"`)
    expect(html).toContain('重试')
    expect(html).toContain('timed out &lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
  })

  it('renders failure page with Chinese product copy', () => {
    const html = buildShellPageHtml({
      kind: 'failure',
      detail: 'Host exited',
      showRetry: true,
    })
    expect(html).toContain('无法启动本地 Host')
    expect(html).toContain('Host exited')
    expect(html).toContain('重试')
  })

  it('omits retry when not requested', () => {
    const html = buildShellPageHtml({ kind: 'failure', detail: 'x' })
    expect(html).not.toContain(SHELL_RETRY_URL)
  })
})

describe('buildShellPageDataUrl', () => {
  it('prefixes a data URL that decodes back to the HTML document', () => {
    const url = buildShellPageDataUrl({ kind: 'loading' })
    expect(url.startsWith('data:text/html;charset=utf-8,')).toBe(true)
    const encoded = url.slice('data:text/html;charset=utf-8,'.length)
    const html = decodeURIComponent(encoded)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('DSH Desktop')
  })
})

describe('buildFirstRunWelcomeScript', () => {
  it('emits a self-invoking script with Chinese welcome copy and success boolean', () => {
    const script = buildFirstRunWelcomeScript()
    expect(script.startsWith('(() => {')).toBe(true)
    expect(script).toContain('dsh-desktop-first-run')
    expect(script).toContain('欢迎使用 DSH Desktop')
    expect(script).toContain('return true')
    expect(script).toContain('return false')
    expect(script).not.toContain('nodeIntegration')
    expect(script).not.toContain('require(')
    expect(FIRST_RUN_WELCOME_MAX_ATTEMPTS).toBe(3)
  })
})
