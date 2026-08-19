/**
 * Minimal SemVer-ish comparison for desktop update decisions.
 * Supports `MAJOR.MINOR.PATCH` with an optional prerelease suffix (`-rc.1`).
 * Build metadata (`+…`) is ignored. Not a full SemVer 2.0 implementation.
 * @module @deepseek-ai/dsh-desktop/version-compare
 */

/** Parsed version components used only inside this module. */
interface ParsedVersion {
  major: number
  minor: number
  patch: number
  /** Dot-separated prerelease identifiers; empty when the release is final. */
  prerelease: string[]
}

/**
 * Compare two version strings.
 * @param left - first version
 * @param right - second version
 * @returns negative when `left < right`, `0` when equal, positive when `left > right`
 * @throws when either string is not a recognizable version
 */
export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left)
  const b = parseVersion(right)

  if (a.major !== b.major) return Math.sign(a.major - b.major)
  if (a.minor !== b.minor) return Math.sign(a.minor - b.minor)
  if (a.patch !== b.patch) return Math.sign(a.patch - b.patch)

  // A final release is greater than any prerelease with the same core.
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0
  if (a.prerelease.length === 0) return 1
  if (b.prerelease.length === 0) return -1

  const n = Math.max(a.prerelease.length, b.prerelease.length)
  for (let i = 0; i < n; i += 1) {
    const ai = a.prerelease[i]
    const bi = b.prerelease[i]
    if (ai === undefined) return -1
    if (bi === undefined) return 1
    const cmp = compareIdentifier(ai, bi)
    if (cmp !== 0) return cmp
  }
  return 0
}

/**
 * Whether `candidate` is strictly newer than `current`.
 * @param current - installed version
 * @param candidate - version from the update feed
 */
export function isNewerVersion(current: string, candidate: string): boolean {
  return compareVersions(candidate, current) > 0
}

/**
 * Parse a version string into numeric core + prerelease identifiers.
 * @param raw - version text (optional leading `v`)
 */
function parseVersion(raw: string): ParsedVersion {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    throw new Error('dsh-desktop: empty version string')
  }

  const withoutBuild = trimmed.startsWith('v') || trimmed.startsWith('V') ? trimmed.slice(1) : trimmed
  const coreAndPre = withoutBuild.split('+', 1)[0] ?? withoutBuild
  const dash = coreAndPre.indexOf('-')
  const core = dash === -1 ? coreAndPre : coreAndPre.slice(0, dash)
  const pre = dash === -1 ? '' : coreAndPre.slice(dash + 1)

  const parts = core.split('.')
  if (parts.length < 1 || parts.length > 3 || parts.some(p => p.length === 0 || !/^\d+$/.test(p))) {
    throw new Error(`dsh-desktop: invalid version "${raw}"`)
  }

  const major = Number(parts[0])
  const minor = Number(parts[1] ?? '0')
  const patch = Number(parts[2] ?? '0')
  if (![major, minor, patch].every(n => Number.isSafeInteger(n) && n >= 0)) {
    throw new Error(`dsh-desktop: invalid version "${raw}"`)
  }

  const prerelease = pre.length === 0 ? [] : pre.split('.').filter(id => id.length > 0)
  if (pre.length > 0 && prerelease.length === 0) {
    throw new Error(`dsh-desktop: invalid version "${raw}"`)
  }
  for (const id of prerelease) {
    if (!/^[0-9A-Za-z-]+$/.test(id)) {
      throw new Error(`dsh-desktop: invalid version "${raw}"`)
    }
  }

  return { major, minor, patch, prerelease }
}

/**
 * Compare one prerelease identifier (numeric identifiers have lower precedence
 * only via numeric comparison when both are purely decimal integers).
 * @param left - identifier
 * @param right - identifier
 */
function compareIdentifier(left: string, right: string): number {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)
  if (leftNumeric && rightNumeric) {
    return Math.sign(Number(left) - Number(right))
  }
  if (leftNumeric) return -1
  if (rightNumeric) return 1
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
