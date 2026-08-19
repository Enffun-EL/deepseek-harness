/**
 * Update feed URL / provider config builders for electron-updater.
 * Defaults target GitHub Releases for the DSH monorepo; callers may override.
 * @module @deepseek-ai/dsh-desktop/feed-url
 */

/** GitHub Releases provider fields accepted by electron-updater. */
export interface GithubReleasesFeed {
  /** electron-updater provider id. */
  provider: 'github'
  /** GitHub owner or org. */
  owner: string
  /** Repository name. */
  repo: string
  /** Optional release channel / latest.yml qualifier (electron-updater). */
  channel?: string
  /** Use `host` override only for GitHub Enterprise. */
  host?: string
}

/** Generic HTTP feed (self-hosted `latest.yml` directory). */
export interface GenericFeed {
  /** electron-updater provider id. */
  provider: 'generic'
  /** Directory URL that serves `latest.yml` / platform artifacts. */
  url: string
  /** Optional channel name. */
  channel?: string
}

/** Union of supported feed configurations for this skeleton. */
export type UpdateFeedConfig = GithubReleasesFeed | GenericFeed

/** Default feed: GitHub Releases for Enffun-EL/deepseek-harness (placeholder until signed installers ship). */
export const DEFAULT_UPDATE_FEED: GithubReleasesFeed = {
  provider: 'github',
  owner: 'Enffun-EL',
  repo: 'deepseek-harness',
}

/**
 * Build a GitHub Releases feed config.
 * @param owner - GitHub owner/org
 * @param repo - repository name
 * @param options - optional channel / host
 * @returns provider config for `autoUpdater.setFeedURL`
 */
export function buildGithubReleasesFeed(
  owner: string,
  repo: string,
  options: { channel?: string; host?: string } = {},
): GithubReleasesFeed {
  const normalizedOwner = owner.trim()
  const normalizedRepo = repo.trim()
  if (normalizedOwner.length === 0 || normalizedRepo.length === 0) {
    throw new Error('dsh-desktop: GitHub update feed requires non-empty owner and repo')
  }
  const feed: GithubReleasesFeed = {
    provider: 'github',
    owner: normalizedOwner,
    repo: normalizedRepo,
  }
  if (options.channel !== undefined && options.channel.trim().length > 0) {
    feed.channel = options.channel.trim()
  }
  if (options.host !== undefined && options.host.trim().length > 0) {
    feed.host = options.host.trim()
  }
  return feed
}

/**
 * Build a generic HTTP feed config from a base directory URL.
 * @param url - absolute URL of the directory that hosts `latest.yml`
 * @param channel - optional channel
 * @returns provider config for `autoUpdater.setFeedURL`
 */
export function buildGenericFeed(url: string, channel?: string): GenericFeed {
  const normalized = url.trim().replace(/\/+$/, '')
  if (normalized.length === 0) {
    throw new Error('dsh-desktop: generic update feed requires a non-empty url')
  }
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(`dsh-desktop: generic update feed url must be http(s): "${url}"`)
  }
  const feed: GenericFeed = {
    provider: 'generic',
    url: `${normalized}/`,
  }
  if (channel !== undefined && channel.trim().length > 0) {
    feed.channel = channel.trim()
  }
  return feed
}

/**
 * Resolve the feed from environment overrides or the default GitHub placeholder.
 *
 * Env (optional):
 * - `DSH_DESKTOP_UPDATE_FEED_URL` — generic HTTP feed directory
 * - `DSH_DESKTOP_UPDATE_GITHUB_OWNER` / `DSH_DESKTOP_UPDATE_GITHUB_REPO` — GitHub pair
 * - `DSH_DESKTOP_UPDATE_CHANNEL` — channel for either provider
 * @param env - environment map (defaults to `process.env`)
 * @returns feed config for electron-updater
 */
export function resolveUpdateFeed(env: NodeJS.ProcessEnv = process.env): UpdateFeedConfig {
  const channel = env.DSH_DESKTOP_UPDATE_CHANNEL?.trim()
  const genericUrl = env.DSH_DESKTOP_UPDATE_FEED_URL?.trim()
  if (genericUrl !== undefined && genericUrl.length > 0) {
    return buildGenericFeed(genericUrl, channel)
  }

  const owner = env.DSH_DESKTOP_UPDATE_GITHUB_OWNER?.trim() || DEFAULT_UPDATE_FEED.owner
  const repo = env.DSH_DESKTOP_UPDATE_GITHUB_REPO?.trim() || DEFAULT_UPDATE_FEED.repo
  return buildGithubReleasesFeed(owner, repo, { channel })
}

/**
 * Human-readable feed description for logs (no secrets).
 * @param feed - resolved feed
 */
export function describeUpdateFeed(feed: UpdateFeedConfig): string {
  if (feed.provider === 'github') {
    const host = feed.host ?? 'github.com'
    const channel = feed.channel !== undefined ? ` channel=${feed.channel}` : ''
    return `github://${host}/${feed.owner}/${feed.repo}${channel}`
  }
  const channel = feed.channel !== undefined ? ` channel=${feed.channel}` : ''
  return `generic:${feed.url}${channel}`
}
