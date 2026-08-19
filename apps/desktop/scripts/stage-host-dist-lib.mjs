/**
 * Pure-ish staging helpers for `ensure-host-dist.mjs`.
 * Kept importable so unit tests can stage into temp dirs without electron-builder.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Relative paths inspected on the monorepo when staging. */
export const MONOREPO_CLI_BIN = path.join('apps', 'cli', 'lib', 'bin.js')
export const MONOREPO_WEB_DIST = path.join('apps', 'web', 'dist')
export const HOST_MANIFEST_NAME = 'host-manifest.json'
export const RUN_HOST_NAME = 'run-host.mjs'

/**
 * @typedef {'placeholder' | 'staged-artifacts'} HostDistMode
 */

/**
 * @typedef {object} HostManifest
 * @property {1} version
 * @property {HostDistMode} mode
 * @property {string} createdAt ISO timestamp
 * @property {string | null} monorepoRoot Absolute monorepo root at pack time (same-machine bridge), else null
 * @property {boolean} hasCliBin
 * @property {boolean} hasWebDist
 * @property {boolean} hasCliConfig
 * @property {string[]} notes Human-readable residual risks / requirements
 */

/**
 * @typedef {object} StageHostDistResult
 * @property {string} hostDist
 * @property {HostManifest} manifest
 * @property {boolean} staged Whether real artifacts were copied (not only a placeholder)
 */

/**
 * Resolve the monorepo root that contains `apps/desktop` (two parents up from desktopRoot).
 * @param {string} desktopRoot
 * @returns {string | null}
 */
export function resolveMonorepoRootFromDesktop(desktopRoot) {
  const candidate = path.resolve(desktopRoot, '..', '..')
  if (existsSync(path.join(candidate, 'pnpm-workspace.yaml')) && existsSync(path.join(candidate, 'apps', 'cli'))) {
    return candidate
  }
  // Fallback: walk up a few levels (nested worktrees / alternate layouts).
  let dir = path.resolve(desktopRoot)
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml')) && existsSync(path.join(dir, 'apps', 'cli'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

/**
 * Empty `hostDist` contents while keeping the directory itself.
 * @param {string} hostDist
 */
export function emptyDirContents(hostDist) {
  mkdirSync(hostDist, { recursive: true })
  for (const name of readdirSync(hostDist)) {
    rmSync(path.join(hostDist, name), { recursive: true, force: true })
  }
}

/**
 * Recursively copy a file or directory using copyFileSync (avoids Node cpSync
 * aborting on some Windows trees under non-ASCII paths).
 * @param {string} from
 * @param {string} to
 * @param {Set<string>} skipNames Basename skip set (applied at every level)
 */
export function copyTree(from, to, skipNames = new Set()) {
  const st = statSync(from)
  if (st.isDirectory()) {
    mkdirSync(to, { recursive: true })
    for (const name of readdirSync(from)) {
      if (skipNames.has(name)) continue
      copyTree(path.join(from, name), path.join(to, name), skipNames)
    }
    return
  }
  if (st.isFile()) {
    mkdirSync(path.dirname(to), { recursive: true })
    copyFileSync(from, to)
  }
  // Ignore other types (sockets, FIFOs) during packaging.
}

/**
 * Copy a file or directory if it exists.
 * Skips bulky TypeScript build residue under `lib/types` when staging CLI lib.
 * @param {string} from
 * @param {string} to
 * @param {{ skipNames?: string[] }} [options]
 * @returns {boolean} whether anything was copied
 */
export function copyIfExists(from, to, options = {}) {
  if (!existsSync(from)) return false
  const skip = new Set(options.skipNames ?? [])
  try {
    copyTree(from, to, skip)
    return true
  } catch (error) {
    console.warn(`dsh-desktop: copy failed ${from} → ${to}: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/**
 * Build the `run-host.mjs` source shipped inside host-dist / resources/host.
 * Resolves a real Node binary (never Electron), prefers a still-valid monorepo
 * checkout recorded at pack time, else runs the staged CLI bin.
 * @returns {string}
 */
export function buildRunHostSource() {
  return `#!/usr/bin/env node
/**
 * Packaged Host entry for DSH Desktop (resources/host/run-host.mjs).
 * Spawned by the Electron shell with: node run-host.mjs web --host 127.0.0.1 --port 0
 *
 * Node resolution order:
 * 1. process.execPath when it looks like Node (not Electron)
 * 2. process.env.NODE / npm_node_execpath when present on disk
 * 3. PATH "node"
 *
 * Host resolution order:
 * 1. monorepoRoot from host-manifest.json when that tree still has a CLI bin (same-machine bridge)
 * 2. staged apps/cli/lib/bin.js under this directory
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const hostRoot = path.dirname(fileURLToPath(import.meta.url))
const manifestPath = path.join(hostRoot, 'host-manifest.json')
const stagedBin = path.join(hostRoot, 'apps', 'cli', 'lib', 'bin.js')
const webArgs = process.argv.slice(2)

function looksLikeNode(execPath) {
  const base = path.basename(execPath).toLowerCase()
  if (base === 'node' || base === 'node.exe') return true
  if (base.includes('electron')) return false
  return false
}

function resolveNodeBinary() {
  if (looksLikeNode(process.execPath)) return process.execPath
  for (const key of ['NODE', 'npm_node_execpath']) {
    const value = process.env[key]
    if (typeof value === 'string' && value.length > 0 && existsSync(value)) return value
  }
  return 'node'
}

function readManifest() {
  if (!existsSync(manifestPath)) return null
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    return null
  }
}

function monorepoLaunchRoot(manifest) {
  const root = manifest && typeof manifest.monorepoRoot === 'string' ? manifest.monorepoRoot : null
  if (root === null || root.length === 0) return null
  const bin = path.join(root, 'apps', 'cli', 'lib', 'bin.js')
  if (!existsSync(bin)) return null
  return root
}

const manifest = readManifest()
const bridgeRoot = monorepoLaunchRoot(manifest)
const launchRoot = bridgeRoot ?? hostRoot
const bin = path.join(launchRoot, 'apps', 'cli', 'lib', 'bin.js')

if (!existsSync(bin)) {
  console.error(
    [
      'dsh-desktop: packaged Host is missing apps/cli/lib/bin.js.',
      'Rebuild with monorepo artifacts (pnpm run build) then pnpm --filter @deepseek-ai/dsh-desktop run ensure-host-dist,',
      'or set DSH_DESKTOP_HOST_ROOT to a monorepo/CLI tree.',
      \`hostRoot=\${hostRoot}\`,
    ].join(' '),
  )
  process.exit(1)
}

const nodeBin = resolveNodeBinary()
const child = spawn(nodeBin, [bin, ...webArgs], {
  cwd: launchRoot,
  env: process.env,
  stdio: 'inherit',
  windowsHide: true,
})

child.on('error', (error) => {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'ENOENT') {
    console.error(
      '未找到可用的 Node.js。DSH Desktop 需要系统安装 Node.js（^22.19 或 >=24）才能启动本地 Host。请安装 Node 并确保 \`node\` 在 PATH 中，或设置环境变量 NODE / npm_node_execpath 指向 Node 可执行文件。',
    )
  } else {
    console.error(error instanceof Error ? error.message : String(error))
  }
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
`
}

/**
 * Write a placeholder host-dist (electron-builder needs the directory to exist).
 * @param {string} hostDist
 * @returns {HostManifest}
 */
export function writePlaceholder(hostDist) {
  mkdirSync(hostDist, { recursive: true })
  const manifest = /** @type {HostManifest} */ ({
    version: 1,
    mode: 'placeholder',
    createdAt: new Date().toISOString(),
    monorepoRoot: null,
    hasCliBin: false,
    hasWebDist: false,
    hasCliConfig: false,
    notes: [
      'Placeholder Host tree for electron-builder extraResources.',
      'Not a runnable Host. Build monorepo apps/cli (and preferably apps/web) then re-run ensure-host-dist.',
      'System Node is still required at runtime; Electron is never used as the Node binary.',
    ],
  })
  writeFileSync(path.join(hostDist, HOST_MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(
    path.join(hostDist, 'README.packaging-placeholder.txt'),
    [
      'Placeholder Host tree for electron-builder extraResources.',
      'This directory is not a runnable Host.',
      'Populate host-dist by running ensure-host-dist after monorepo build artifacts exist,',
      'or set DSH_DESKTOP_HOST_ROOT at runtime. See apps/desktop README Packaging section.',
      '',
    ].join('\n'),
    'utf8',
  )
  return manifest
}

/**
 * Stage a best-effort Host layout into `hostDist` from monorepo artifacts when present.
 * @param {object} options
 * @param {string} options.hostDist Destination directory (apps/desktop/host-dist)
 * @param {string | null} [options.monorepoRoot] Monorepo root; resolved from hostDist when omitted
 * @param {boolean} [options.clean=true] Empty hostDist before staging
 * @returns {StageHostDistResult}
 */
export function stageHostDist(options) {
  const hostDist = path.resolve(options.hostDist)
  const desktopRoot = path.dirname(hostDist)
  const monorepoRoot =
    options.monorepoRoot === undefined
      ? resolveMonorepoRootFromDesktop(desktopRoot)
      : options.monorepoRoot === null
        ? null
        : path.resolve(options.monorepoRoot)

  if (options.clean !== false) {
    emptyDirContents(hostDist)
  } else {
    mkdirSync(hostDist, { recursive: true })
  }

  const cliBinSrc = monorepoRoot === null ? null : path.join(monorepoRoot, MONOREPO_CLI_BIN)
  const hasCliBin = cliBinSrc !== null && existsSync(cliBinSrc)

  if (!hasCliBin || monorepoRoot === null) {
    const manifest = writePlaceholder(hostDist)
    return { hostDist, manifest, staged: false }
  }

  // CLI runtime chunks (tsdown may emit several files beside bin.js).
  // Skip lib/types (tsc declaration emit) — not needed to run bin.js.
  copyIfExists(path.join(monorepoRoot, 'apps', 'cli', 'lib'), path.join(hostDist, 'apps', 'cli', 'lib'), {
    skipNames: ['types', 'tsconfig.tsbuildinfo'],
  })
  copyIfExists(path.join(monorepoRoot, 'apps', 'cli', 'package.json'), path.join(hostDist, 'apps', 'cli', 'package.json'))
  const hasCliConfig = copyIfExists(
    path.join(monorepoRoot, 'apps', 'cli', 'config'),
    path.join(hostDist, 'apps', 'cli', 'config'),
  )

  const hasWebDist = copyIfExists(
    path.join(monorepoRoot, MONOREPO_WEB_DIST),
    path.join(hostDist, MONOREPO_WEB_DIST),
  )
  if (hasWebDist) {
    copyIfExists(
      path.join(monorepoRoot, 'apps', 'web', 'package.json'),
      path.join(hostDist, 'apps', 'web', 'package.json'),
    )
  }

  // Same-machine bridge: packaged resources/host can re-invoke the monorepo CLI
  // when that absolute path still exists (dev packs / local installers).
  const monorepoStillHasModules =
    existsSync(path.join(monorepoRoot, 'node_modules')) ||
    existsSync(path.join(monorepoRoot, 'pnpm-workspace.yaml'))

  const notes = [
    'Staged CLI lib (+ config) and optional apps/web/dist from the monorepo at pack time.',
    'Full offline Host (vendored node_modules + portable Node) is NOT shipped in this MVP.',
    'Runtime still requires system Node.js (^22.19 || >=24) on PATH (or NODE / npm_node_execpath).',
    monorepoStillHasModules
      ? 'host-manifest monorepoRoot enables a same-machine bridge to the pack-time checkout when it still exists.'
      : 'monorepoRoot recorded but node_modules were missing at pack time; prefer DSH_DESKTOP_HOST_ROOT to a built checkout.',
    'If the monorepo bridge is unavailable, the staged bin alone will not resolve workspace packages without a full install.',
  ]

  /** @type {HostManifest} */
  const manifest = {
    version: 1,
    mode: 'staged-artifacts',
    createdAt: new Date().toISOString(),
    monorepoRoot: monorepoRoot,
    hasCliBin: true,
    hasWebDist,
    hasCliConfig,
    notes,
  }

  writeFileSync(path.join(hostDist, HOST_MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(path.join(hostDist, RUN_HOST_NAME), buildRunHostSource(), 'utf8')
  writeFileSync(
    path.join(hostDist, 'README.host-dist.txt'),
    [
      'DSH Desktop staged Host layout (MVP).',
      '',
      'Bundled when monorepo artifacts exist at pack time:',
      '- apps/cli/lib/** (including bin.js)',
      '- apps/cli/package.json and apps/cli/config/** when present',
      '- apps/web/dist/** when present',
      '- run-host.mjs + host-manifest.json',
      '',
      'NOT bundled:',
      '- portable Node.js binary',
      '- full monorepo node_modules / pnpm virtual store',
      '',
      'Boot path: Electron shell → system node → run-host.mjs → CLI bin (monorepo bridge preferred).',
      'See apps/desktop README Packaging section.',
      '',
    ].join('\n'),
    'utf8',
  )

  return { hostDist, manifest, staged: true }
}

/**
 * Read a host-manifest.json if present.
 * @param {string} hostRoot
 * @returns {HostManifest | null}
 */
export function readHostManifest(hostRoot) {
  const file = path.join(hostRoot, HOST_MANIFEST_NAME)
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/**
 * Create a temp directory under the OS temp root (tests).
 * @param {string} [prefix]
 * @returns {string}
 */
export function makeTempDir(prefix = 'dsh-host-dist-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix))
}

/**
 * True when path exists and is a directory.
 * @param {string} dir
 */
export function isDirectory(dir) {
  try {
    return statSync(dir).isDirectory()
  } catch {
    return false
  }
}
