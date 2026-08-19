/**
 * Pure HTML builders for DSH Desktop shell status pages (loading / failure).
 * Kept free of Electron imports so unit tests can assert copy and structure.
 * @module @deepseek-ai/dsh-desktop/shell-pages
 */

/** Kind of shell status page. */
export type ShellPageKind = 'loading' | 'timeout' | 'failure'

/** Options for a branded shell status page. */
export interface ShellPageOptions {
  /** Page role. */
  kind: ShellPageKind
  /** Optional technical detail (escaped). */
  detail?: string
  /** When true, render a retry control that navigates to {@link SHELL_RETRY_URL}. */
  showRetry?: boolean
  /** When true, use first-launch loading copy. */
  isFirstLaunch?: boolean
}

/** Custom URL intercepted by the main process to re-run boot. */
export const SHELL_RETRY_URL = 'dsh-desktop://retry'

/**
 * Escape text embedded into shell HTML.
 * @param value - raw message
 * @returns HTML-safe text
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Classify a Host start error for the matching branded page.
 * @param message - error message from the supervisor or launcher
 * @returns page kind (timeout vs generic failure)
 */
export function classifyHostStartError(message: string): Exclude<ShellPageKind, 'loading'> {
  if (/timed out/i.test(message)) return 'timeout'
  // Missing system Node is still a failure page; detail copy comes from formatHostStartErrorDetail.
  return 'failure'
}

/**
 * Build a self-contained status HTML document (Chinese product copy).
 * @param options - page kind and optional detail / retry
 * @returns full HTML document
 */
export function buildShellPageHtml(options: ShellPageOptions): string {
  const isError = options.kind !== 'loading'
  const showRetry = options.showRetry === true && isError
  const copy = resolveCopy(options)
  const detailBlock =
    options.detail !== undefined && options.detail.length > 0
      ? `<pre class="detail">${escapeHtml(options.detail)}</pre>`
      : ''
  const retryBlock = showRetry
    ? `<p class="actions"><a class="btn" href="${SHELL_RETRY_URL}">重试</a></p>`
    : ''
  const spinner = options.kind === 'loading' ? '<div class="spinner" aria-hidden="true"></div>' : ''
  const accent = options.kind === 'timeout' ? '#b45309' : isError ? '#b91c1c' : '#0f172a'

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.documentTitle)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f1f5f9;
      --card: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --accent: ${accent};
      --line: #e2e8f0;
      --btn: #0f172a;
      --btn-ink: #f8fafc;
    }
    * { box-sizing: border-box; }
    html, body {
      height: 100%;
      margin: 0;
      font-family: "Segoe UI", system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
      background:
        radial-gradient(1200px 600px at 10% -10%, #dbeafe 0%, transparent 55%),
        radial-gradient(900px 500px at 100% 0%, #e2e8f0 0%, transparent 50%),
        var(--bg);
      color: var(--ink);
    }
    main {
      min-height: 100%;
      display: grid;
      place-items: center;
      padding: 2rem 1.25rem;
    }
    .card {
      width: min(32rem, 100%);
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 1rem;
      padding: 1.75rem 1.5rem 1.5rem;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      text-align: center;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 1rem;
    }
    .mark {
      width: 0.65rem;
      height: 0.65rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.35rem;
      line-height: 1.35;
      font-weight: 650;
      color: var(--accent);
    }
    .lede {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.95rem;
    }
    .detail {
      margin: 1rem 0 0;
      padding: 0.75rem 0.85rem;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 12rem;
      overflow: auto;
      font: 0.78rem/1.5 ui-monospace, "Cascadia Code", Consolas, monospace;
      color: #334155;
      background: #f8fafc;
      border: 1px solid var(--line);
      border-radius: 0.6rem;
    }
    .actions { margin: 1.25rem 0 0; }
    .btn {
      display: inline-block;
      padding: 0.55rem 1.15rem;
      border-radius: 0.55rem;
      background: var(--btn);
      color: var(--btn-ink);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.92rem;
    }
    .btn:hover { filter: brightness(1.08); }
    .btn:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 2px;
    }
    .spinner {
      width: 1.75rem;
      height: 1.75rem;
      margin: 0 auto 1rem;
      border-radius: 999px;
      border: 2px solid #cbd5e1;
      border-top-color: var(--accent);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <main>
    <section class="card" role="${isError ? 'alert' : 'status'}" aria-live="polite">
      <p class="brand"><span class="mark"></span>DSH Desktop</p>
      ${spinner}
      <h1>${escapeHtml(copy.headline)}</h1>
      <p class="lede">${escapeHtml(copy.lede)}</p>
      ${detailBlock}
      ${retryBlock}
    </section>
  </main>
</body>
</html>`
}

/**
 * Wrap HTML as a `data:` URL for `BrowserWindow.loadURL`.
 * @param html - full document
 * @returns data URL
 */
export function shellPageDataUrl(html: string): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
}

/**
 * Build the data URL for a shell status page.
 * @param options - page options
 * @returns data URL
 */
export function buildShellPageDataUrl(options: ShellPageOptions): string {
  return shellPageDataUrl(buildShellPageHtml(options))
}

/**
 * Script body injected after the Host UI loads on first launch.
 * Inserts a non-blocking top status strip that auto-dismisses.
 * @returns IIFE source (no surrounding script tags)
 */
export function buildFirstRunWelcomeScript(): string {
  const message = '欢迎使用 DSH Desktop。本地 Host 已就绪，可开始对话与任务。'
  const safe = JSON.stringify(message)
  return `(() => {
  try {
    if (document.getElementById('dsh-desktop-first-run')) return;
    const bar = document.createElement('div');
    bar.id = 'dsh-desktop-first-run';
    bar.setAttribute('role', 'status');
    bar.textContent = ${safe};
    bar.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:2147483647',
      'padding:10px 16px',
      'background:#0f172a',
      'color:#f8fafc',
      "font:14px/1.45 system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif",
      'text-align:center',
      'box-shadow:0 2px 10px rgba(15,23,42,.28)',
      'pointer-events:none',
    ].join(';');
    (document.documentElement || document.body).appendChild(bar);
    window.setTimeout(() => {
      bar.style.transition = 'opacity .45s ease';
      bar.style.opacity = '0';
      window.setTimeout(() => bar.remove(), 480);
    }, 6500);
  } catch (_) {
    /* Host document may be mid-navigation; strip is best-effort. */
  }
})();`
}

interface PageCopy {
  documentTitle: string
  headline: string
  lede: string
}

/**
 * Resolve Chinese product copy for a shell page.
 * @param options - page options
 */
function resolveCopy(options: ShellPageOptions): PageCopy {
  switch (options.kind) {
    case 'loading':
      if (options.isFirstLaunch === true) {
        return {
          documentTitle: 'DSH Desktop · 首次启动',
          headline: '首次启动，正在准备',
          lede: '正在拉起本地 Host 并加载 Web UI，通常只需片刻。首次启动可能稍慢。',
        }
      }
      return {
        documentTitle: 'DSH Desktop · 启动中',
        headline: '正在启动本地 Host',
        lede: 'DSH Desktop 正在准备 Web UI，请稍候…',
      }
    case 'timeout':
      return {
        documentTitle: 'DSH Desktop · 启动超时',
        headline: '启动超时',
        lede: '本地 Host 在限定时间内未报告就绪。可检查仓库构建产物或源码启动依赖后重试。',
      }
    case 'failure':
      return {
        documentTitle: 'DSH Desktop · 启动失败',
        headline: '无法启动本地 Host',
        lede: '本地 Host 进程未能就绪。请查看下方详情，修复环境后点击重试。',
      }
    default: {
      const _exhaustive: never = options.kind
      return _exhaustive
    }
  }
}
