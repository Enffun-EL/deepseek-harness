import { describe, expect, it } from 'vitest'
import {
  buildGenericFeed,
  buildGithubReleasesFeed,
  DEFAULT_UPDATE_FEED,
  describeUpdateFeed,
  resolveUpdateFeed,
} from '../src/feed-url.js'

describe('buildGithubReleasesFeed', () => {
  it('builds a github provider config', () => {
    expect(buildGithubReleasesFeed('Enffun-EL', 'deepseek-harness')).toEqual({
      provider: 'github',
      owner: 'Enffun-EL',
      repo: 'deepseek-harness',
    })
  })

  it('includes optional channel and host', () => {
    expect(
      buildGithubReleasesFeed('acme', 'app', { channel: 'beta', host: 'github.example.com' }),
    ).toEqual({
      provider: 'github',
      owner: 'acme',
      repo: 'app',
      channel: 'beta',
      host: 'github.example.com',
    })
  })

  it('rejects empty owner or repo', () => {
    expect(() => buildGithubReleasesFeed(' ', 'repo')).toThrow(/non-empty/)
  })
})

describe('buildGenericFeed', () => {
  it('normalizes a trailing slash on http(s) urls', () => {
    expect(buildGenericFeed('https://example.com/updates')).toEqual({
      provider: 'generic',
      url: 'https://example.com/updates/',
    })
  })

  it('rejects non-http urls', () => {
    expect(() => buildGenericFeed('ftp://example.com/x')).toThrow(/http\(s\)/)
  })
})

describe('resolveUpdateFeed', () => {
  it('defaults to the Enffun-EL/deepseek-harness GitHub Releases placeholder', () => {
    expect(resolveUpdateFeed({})).toEqual(DEFAULT_UPDATE_FEED)
  })

  it('prefers a generic feed URL env override', () => {
    expect(
      resolveUpdateFeed({
        DSH_DESKTOP_UPDATE_FEED_URL: 'https://cdn.example.com/dsh-desktop',
        DSH_DESKTOP_UPDATE_CHANNEL: 'latest',
      }),
    ).toEqual({
      provider: 'generic',
      url: 'https://cdn.example.com/dsh-desktop/',
      channel: 'latest',
    })
  })

  it('honors GitHub owner/repo env overrides', () => {
    expect(
      resolveUpdateFeed({
        DSH_DESKTOP_UPDATE_GITHUB_OWNER: 'other-org',
        DSH_DESKTOP_UPDATE_GITHUB_REPO: 'other-repo',
      }),
    ).toEqual({
      provider: 'github',
      owner: 'other-org',
      repo: 'other-repo',
    })
  })
})

describe('describeUpdateFeed', () => {
  it('formats github and generic feeds for logs', () => {
    expect(describeUpdateFeed(DEFAULT_UPDATE_FEED)).toBe(
      'github://github.com/Enffun-EL/deepseek-harness',
    )
    expect(describeUpdateFeed(buildGenericFeed('https://example.com/u'))).toBe(
      'generic:https://example.com/u/',
    )
  })
})
