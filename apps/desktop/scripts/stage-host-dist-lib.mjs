/**
 * Staging helpers for `ensure-host-dist.mjs`.
 * Product mode stages a self-contained Host runtime:
 * - portable Node under host-dist/node/
 * - pnpm-deployed @deepseek-ai/dsh closure under host-dist/runtime/
 * - web frontend dist, run-host.mjs, host-manifest.json
 * Dev/tests can skip product steps and keep the lighter artifact staging path.
 */
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { execFileSync } from 'node:child_process'
import { createGunzip } from 'node:zlib'

export const MONOREPO_CLI_BIN = path.join('apps', 'cli', 'lib', 'bin.js')
export const MONOREPO_WEB_DIST = path.join('apps', 'web', 'dist')
export const HOST_MANIFEST_NAME = 'host-manifest.json'
export const RUN_HOST_NAME = 'run-host.mjs'
export const RUNTIME_DIR_NAME = 'runtime'
export const NODE_DIR_NAME = 'node'

/**
 * @typedef {'placeholder' | 'staged-artifacts' | 'product-runtime'} HostDistMode
 */

/**
 * @typedef {object} HostManifest
 * @property {2} version
 * @property {HostDistMode} mode
 * @property {string} createdAt
 * @property {string | null} monorepoRoot
 * @property {boolean} hasCliBin
 * @property {boolean} hasWebDist
 * @property {boolean} hasCliConfig
 * @property {boolean} hasRuntimeDeploy
 * @property {boolean} hasPortableNode
 * @property {string | null} portableNodeVersion
 * @property {string[]} notes
 */

/**
 * @typedef {object} StageHostDistResult
 * @property {string} hostDist
 * @property {HostManifest} manifest
 * @property {boolean} staged
 */

export function resolveMonorepoRootFromDesktop(desktopRoot) {
  const candidate = path.resolve(desktopRoot, '..', '..')
  if (existsSync(path.join(candidate, 'pnpm-workspace.yaml')) && existsSync(path.join(candidate, 'apps', 'cli'))) {
    return candidate
  }
  let dir = path.resolve(desktopRoot)
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml')) && existsSync(path.join(dir, 'apps', 'cli'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export function emptyDirContents(hostDist) {
  mkdirSync(hostDist, { recursive: true })
  for (const name of readdirSync(hostDist)) {
    rmSync(path.join(hostDist, name), { recursive: true, force: true })
  }
}

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
}

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

/** @param {string} hostRoot */
export function resolveBundledNodePath(hostRoot) {
  if (process.platform === 'win32') return path.join(hostRoot, NODE_DIR_NAME, 'node.exe')
  return path.join(hostRoot, NODE_DIR_NAME, 'bin', 'node')
}

/** @param {string} hostRoot */
export function resolveDeployedCliBin(hostRoot) {
  // pnpm deploy places the package files at the deploy root.
  return path.join(hostRoot, RUNTIME_DIR_NAME, 'lib', 'bin.js')
}

export function buildRunHostSource() {
  return `#!/usr/bin/env node
/**
 * Packaged Host entry (resources/host/run-host.mjs).
 * Prefer bundled portable Node + pnpm-deployed runtime closure.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const hostRoot = path.dirname(fileURLToPath(import.meta.url))
const manifestPath = path.join(hostRoot, 'host-manifest.json')
const webArgs = process.argv.slice(2)

function looksLikeNode(execPath) {
  const base = path.basename(execPath).toLowerCase()
  if (base === 'node' || base === 'node.exe') return true
  if (base.includes('electron')) return false
  return false
}

function bundledNode() {
  if (process.platform === 'win32') {
    const p = path.join(hostRoot, 'node', 'node.exe')
    return existsSync(p) ? p : null
  }
  const p = path.join(hostRoot, 'node', 'bin', 'node')
  return existsSync(p) ? p : null
}

function resolveNodeBinary() {
  const bundled = bundledNode()
  if (bundled) return bundled
  if (looksLikeNode(process.execPath)) return process.execPath
  for (const key of ['NODE', 'npm_node_execpath']) {
    const value = process.env[key]
    if (typeof value === 'string' && value.length > 0 && existsSync(value)) return value
  }
  return 'node'
}

function readManifest() {
  if (!existsSync(manifestPath)) return null
  try { return JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { return null }
}

function monorepoLaunch(manifest) {
  const root = manifest && typeof manifest.monorepoRoot === 'string' ? manifest.monorepoRoot : null
  if (!root) return null
  const bin = path.join(root, 'apps', 'cli', 'lib', 'bin.js')
  return existsSync(bin) ? { cwd: root, bin } : null
}

const manifest = readManifest()
const deployedBin = path.join(hostRoot, 'runtime', 'lib', 'bin.js')
const stagedBin = path.join(hostRoot, 'apps', 'cli', 'lib', 'bin.js')
const bridge = monorepoLaunch(manifest)

let cwd
let bin
if (existsSync(deployedBin)) {
  cwd = path.join(hostRoot, 'runtime')
  bin = deployedBin
} else if (bridge) {
  cwd = bridge.cwd
  bin = bridge.bin
} else if (existsSync(stagedBin)) {
  cwd = hostRoot
  bin = stagedBin
} else {
  console.error('dsh-desktop: packaged Host runtime is incomplete (missing runtime/lib/bin.js). Rebuild with product runtime staging.')
  process.exit(1)
}

const nodeBin = resolveNodeBinary()
const child = spawn(nodeBin, [bin, ...webArgs], {
  cwd,
  env: process.env,
  stdio: 'inherit',
  windowsHide: true,
})

child.on('error', (error) => {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  if (code === 'ENOENT') {
    console.error('未找到可用的 Node.js。安装包应自带 portable Node；若缺失请重装 DSH Desktop，或安装系统 Node.js（^22.19 或 >=24）。')
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

export function writePlaceholder(hostDist) {
  mkdirSync(hostDist, { recursive: true })
  const manifest = {
    version: 2,
    mode: 'placeholder',
    createdAt: new Date().toISOString(),
    monorepoRoot: null,
    hasCliBin: false,
    hasWebDist: false,
    hasCliConfig: false,
    hasRuntimeDeploy: false,
    hasPortableNode: false,
    portableNodeVersion: null,
    notes: [
      'Placeholder Host tree for electron-builder extraResources.',
      'Not runnable. Build monorepo then re-run ensure-host-dist (product runtime).',
    ],
  }
  writeFileSync(path.join(hostDist, HOST_MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(
    path.join(hostDist, 'README.packaging-placeholder.txt'),
    'Placeholder Host tree. Run ensure-host-dist after pnpm run build.\n',
    'utf8',
  )
  return manifest
}

/**
 * Deploy @deepseek-ai/dsh production closure into hostDist/runtime.
 * @param {string} monorepoRoot
 * @param {string} hostDist
 * @returns {boolean}
 */
export function deployCliRuntime(monorepoRoot, hostDist) {
  const runtimeDir = path.join(hostDist, RUNTIME_DIR_NAME)
  rmSync(runtimeDir, { recursive: true, force: true })
  mkdirSync(runtimeDir, { recursive: true })
  try {
    execFileSync(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['--filter', '@deepseek-ai/dsh', 'deploy', '--prod', '--legacy', runtimeDir],
      {
        cwd: monorepoRoot,
        stdio: 'inherit',
        env: process.env,
        windowsHide: true,
        shell: process.platform === 'win32',
      },
    )
  } catch (error) {
    console.warn(
      `dsh-desktop: pnpm deploy failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    return false
  }
  const bin = path.join(runtimeDir, 'lib', 'bin.js')
  if (!existsSync(bin)) {
    console.warn(`dsh-desktop: deploy finished but ${bin} is missing`)
    return false
  }
  // electron-builder on Windows needs real files, not workspace links.
  materializePackageLinks(path.join(runtimeDir, 'node_modules'))
  // pnpm deploy --prod can omit workspace peers that monorepo hoisting satisfied.
  repairMissingWorkspacePackages(monorepoRoot, runtimeDir)
  // Hoist every package from the pnpm virtual store so bare Node resolution works
  // without relying on .pnpm nested node_modules (Electron/Windows packaging).
  hoistPnpmVirtualStore(path.join(runtimeDir, 'node_modules'))
  return true
}

/**
 * Copy packages from `node_modules/.pnpm/* /node_modules/<pkg>` up to the
 * top-level `node_modules/<pkg>` when missing. Covers npm deps like `ws`
 * that stay nested under the virtual store after `pnpm deploy --legacy`.
 * @param {string} runtimeNm
 */
export function hoistPnpmVirtualStore(runtimeNm) {
  const pnpmDir = path.join(runtimeNm, '.pnpm')
  if (!existsSync(pnpmDir)) return
  let hoisted = 0
  let entries
  try {
    entries = readdirSync(pnpmDir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const nestedNm = path.join(pnpmDir, entry.name, 'node_modules')
    if (!existsSync(nestedNm)) continue
    hoistNodeModulesLevel(nestedNm, runtimeNm, (count) => {
      hoisted += count
    })
  }
  if (hoisted > 0) {
    console.log(`dsh-desktop: hoisted ${String(hoisted)} package(s) from .pnpm virtual store`)
  }
}

/**
 * @param {string} fromNm
 * @param {string} toNm
 * @param {(n: number) => void} onCopied
 */
function hoistNodeModulesLevel(fromNm, toNm, onCopied) {
  let entries
  try {
    entries = readdirSync(fromNm, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    if (entry.name === '.bin' || entry.name === '.pnpm') continue
    if (entry.name.startsWith('@')) {
      const scopeDir = path.join(fromNm, entry.name)
      let scoped
      try {
        scoped = readdirSync(scopeDir, { withFileTypes: true })
      } catch {
        continue
      }
      for (const pkg of scoped) {
        if (!pkg.isDirectory() && !pkg.isSymbolicLink()) continue
        const src = path.join(scopeDir, pkg.name)
        const dest = path.join(toNm, entry.name, pkg.name)
        if (existsSync(dest)) continue
        try {
          mkdirSync(path.dirname(dest), { recursive: true })
          const real = fsRealpath(src)
          copyTree(real, dest, new Set(['node_modules']))
          onCopied(1)
        } catch (error) {
          console.warn(
            `dsh-desktop: hoist failed ${entry.name}/${pkg.name}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }
      continue
    }
    const src = path.join(fromNm, entry.name)
    const dest = path.join(toNm, entry.name)
    if (existsSync(dest)) continue
    try {
      const real = fsRealpath(src)
      copyTree(real, dest, new Set(['node_modules']))
      onCopied(1)
    } catch (error) {
      console.warn(
        `dsh-desktop: hoist failed ${entry.name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}

/**
 * Copy missing workspace / scoped packages declared as dependencies or peers
 * of the deployed tree from the monorepo install into runtime/node_modules.
 * @param {string} monorepoRoot
 * @param {string} runtimeDir
 */
export function repairMissingWorkspacePackages(monorepoRoot, runtimeDir) {
  const runtimeNm = path.join(runtimeDir, 'node_modules')
  if (!existsSync(runtimeNm)) return

  /** @type {Set<string>} */
  const needed = new Set()
  const collectFromPackageJson = (pkgPath) => {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
        const block = pkg[field]
        if (!block || typeof block !== 'object') continue
        for (const name of Object.keys(block)) needed.add(name)
      }
    } catch {
      // ignore
    }
  }

  collectFromPackageJson(path.join(runtimeDir, 'package.json'))
  const walkPkgs = (dir) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const full = path.join(dir, entry.name)
      if (entry.name.startsWith('@')) {
        for (const scoped of readdirSync(full, { withFileTypes: true })) {
          if (!scoped.isDirectory()) continue
          const pkgJson = path.join(full, scoped.name, 'package.json')
          if (existsSync(pkgJson)) collectFromPackageJson(pkgJson)
        }
      } else if (entry.name !== '.bin' && entry.name !== '.pnpm') {
        const pkgJson = path.join(full, 'package.json')
        if (existsSync(pkgJson)) collectFromPackageJson(pkgJson)
      }
    }
  }
  walkPkgs(runtimeNm)

  let copied = 0
  for (const name of needed) {
    const dest = path.join(runtimeNm, ...name.split('/'))
    if (existsSync(dest)) continue
    // Prefer monorepo workspace resolution for @deepseek-ai / @cordiverse.
    let src = null
    if (name.startsWith('@deepseek-ai/') || name.startsWith('@cordiverse/')) {
      src = resolvePackageFromMonorepo(monorepoRoot, name)
    }
    if (src === null) {
      src = resolvePackageFromPnpmStore(runtimeNm, name)
    }
    if (src === null && (name.startsWith('@deepseek-ai/') || name.startsWith('@cordiverse/'))) {
      console.warn(`dsh-desktop: missing package not found: ${name}`)
      continue
    }
    if (src === null) continue
    try {
      mkdirSync(path.dirname(dest), { recursive: true })
      copyTree(src, dest, new Set(['node_modules', '.git']))
      copied += 1
    } catch (error) {
      console.warn(
        `dsh-desktop: failed to copy ${name}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  if (copied > 0) {
    console.log(`dsh-desktop: repaired ${String(copied)} missing package(s) into runtime/node_modules`)
  }
}

/**
 * Find a package directory under the deploy virtual store.
 * @param {string} runtimeNm
 * @param {string} packageName
 * @returns {string | null}
 */
function resolvePackageFromPnpmStore(runtimeNm, packageName) {
  const pnpmDir = path.join(runtimeNm, '.pnpm')
  if (!existsSync(pnpmDir)) return null
  const parts = packageName.split('/')
  let entries
  try {
    entries = readdirSync(pnpmDir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const candidate = path.join(pnpmDir, entry.name, 'node_modules', ...parts)
    if (existsSync(path.join(candidate, 'package.json'))) {
      try {
        return fsRealpath(candidate)
      } catch {
        return candidate
      }
    }
  }
  return null
}

/**
 * @param {string} monorepoRoot
 * @param {string} packageName
 * @returns {string | null} real package directory
 */
function resolvePackageFromMonorepo(monorepoRoot, packageName) {
  const direct = path.join(monorepoRoot, 'node_modules', ...packageName.split('/'))
  if (existsSync(direct)) {
    try { return fsRealpath(direct) } catch { return direct }
  }
  // Workspace packages live under packages/*/* or apps/* or vendor/*
  const candidates = [
    path.join(monorepoRoot, 'vendor'),
    path.join(monorepoRoot, 'packages'),
    path.join(monorepoRoot, 'apps'),
  ]
  for (const root of candidates) {
    if (!existsSync(root)) continue
    const hit = findPackageDirByName(root, packageName, 4)
    if (hit !== null) return hit
  }
  return null
}

/**
 * @param {string} root
 * @param {string} packageName
 * @param {number} depth
 * @returns {string | null}
 */
function findPackageDirByName(root, packageName, depth) {
  if (depth < 0 || !existsSync(root)) return null
  const pkgJson = path.join(root, 'package.json')
  if (existsSync(pkgJson)) {
    try {
      const name = JSON.parse(readFileSync(pkgJson, 'utf8')).name
      if (name === packageName) return root
    } catch {
      // ignore
    }
  }
  let entries
  try { entries = readdirSync(root, { withFileTypes: true }) } catch { return null }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'lib') continue
    const hit = findPackageDirByName(path.join(root, entry.name), packageName, depth - 1)
    if (hit !== null) return hit
  }
  return null
}

/**
 * Replace symlinks under dir with real directory/file copies (best-effort).
 * @param {string} dir
 */
export function materializePackageLinks(dir) {
  if (!existsSync(dir)) return
  /** @type {string[]} */
  const links = []
  const walk = (current) => {
    let entries
    try { entries = readdirSync(current, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      try {
        const st = statSync(full)
        // Dirent.isSymbolicLink is reliable; stat follows links on some platforms.
      } catch { continue }
      if (entry.isSymbolicLink()) {
        links.push(full)
        continue
      }
      if (entry.isDirectory() && entry.name !== '.bin') walk(full)
    }
  }
  walk(dir)
  for (const linkPath of links) {
    try {
      const target = fsRealpath(linkPath)
      const base = path.basename(path.dirname(linkPath))
      if (base === '.bin') {
        rmSync(linkPath, { force: true })
        continue
      }
      rmSync(linkPath, { recursive: true, force: true })
      copyTree(target, linkPath, new Set(['node_modules']))
    } catch (error) {
      console.warn(`dsh-desktop: materialize link failed ${linkPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

const require = createRequire(import.meta.url)
function fsRealpath(p) {
  return require('node:fs').realpathSync(p)
}

/**
 * Download and extract a portable Node distribution into hostDist/node.
 * @param {string} hostDist
 * @param {{ version?: string, platform?: NodeJS.Platform, arch?: string }} [opts]
 * @returns {{ ok: boolean, version: string | null }}
 */
export async function bundlePortableNode(hostDist, opts = {}) {
  const version = (opts.version ?? process.version).replace(/^v/, '')
  const platform = opts.platform ?? process.platform
  const arch = opts.arch ?? process.arch
  const nodeRoot = path.join(hostDist, NODE_DIR_NAME)
  rmSync(nodeRoot, { recursive: true, force: true })
  mkdirSync(nodeRoot, { recursive: true })

  const { url, archiveName, kind } = nodeDistUrl(version, platform, arch)
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'dsh-node-dist-'))
  const archivePath = path.join(tmp, archiveName)
  try {
    await downloadFile(url, archivePath)
    extractNodeArchive(archivePath, tmp, kind)
    const extracted = path.join(tmp, `node-v${version}-${nodePlatformTriple(platform, arch)}`)
    if (!existsSync(extracted)) {
      throw new Error(`extracted Node tree missing at ${extracted}`)
    }
    // Flatten into host-dist/node
    if (platform === 'win32') {
      copyTree(extracted, nodeRoot)
    } else {
      // keep bin/node layout
      copyTree(extracted, nodeRoot)
    }
    const bin = resolveBundledNodePath(hostDist)
    if (!existsSync(bin)) throw new Error(`portable node binary missing at ${bin}`)
    return { ok: true, version }
  } catch (error) {
    console.warn(`dsh-desktop: portable Node bundle failed: ${error instanceof Error ? error.message : String(error)}`)
    rmSync(nodeRoot, { recursive: true, force: true })
    return { ok: false, version: null }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

function nodePlatformTriple(platform, arch) {
  if (platform === 'win32') return `win-${arch}`
  if (platform === 'darwin') return `darwin-${arch}`
  return `linux-${arch}`
}

function nodeDistUrl(version, platform, arch) {
  const triple = nodePlatformTriple(platform, arch)
  const kind = platform === 'win32' ? 'zip' : 'tar.gz'
  const archiveName = `node-v${version}-${triple}.${kind}`
  const mirror = process.env.DSH_DESKTOP_NODE_MIRROR
    ?? process.env.NODEJS_ORG_MIRROR
    ?? 'https://npmmirror.com/mirrors/node'
  const base = mirror.replace(/\/$/, '')
  const url = `${base}/v${version}/${archiveName}`
  return { url, archiveName, kind }
}

async function downloadFile(url, dest) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok || res.body === null) {
    throw new Error(`download ${url} failed: HTTP ${res.status}`)
  }
  await pipeline(res.body, createWriteStream(dest))
}

function extractNodeArchive(archivePath, destDir, kind) {
  if (kind === 'zip') {
    if (process.platform === 'win32') {
      execFileSync(
        'powershell.exe',
        ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`],
        { stdio: 'inherit', windowsHide: true },
      )
      return
    }
    execFileSync('unzip', ['-q', archivePath, '-d', destDir], { stdio: 'inherit' })
    return
  }
  execFileSync('tar', ['-xzf', archivePath, '-C', destDir], { stdio: 'inherit' })
}

/**
 * @param {object} options
 * @param {string} options.hostDist
 * @param {string | null} [options.monorepoRoot]
 * @param {boolean} [options.clean=true]
 * @param {boolean} [options.productRuntime=false]
 * @param {boolean} [options.bundleNode]
 * @param {boolean} [options.deployRuntime]
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

  if (options.clean !== false) emptyDirContents(hostDist)
  else mkdirSync(hostDist, { recursive: true })

  const cliBinSrc = monorepoRoot === null ? null : path.join(monorepoRoot, MONOREPO_CLI_BIN)
  const hasCliBin = cliBinSrc !== null && existsSync(cliBinSrc)
  if (!hasCliBin || monorepoRoot === null) {
    return { hostDist, manifest: writePlaceholder(hostDist), staged: false }
  }

  // Always stage lightweight CLI/web artifacts for diagnostics + fallback.
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

  const wantProduct = options.productRuntime === true
  const wantDeploy = options.deployRuntime ?? wantProduct
  const wantNode = options.bundleNode ?? wantProduct

  let hasRuntimeDeploy = false
  if (wantDeploy) {
    hasRuntimeDeploy = deployCliRuntime(monorepoRoot, hostDist)
  }

  let hasPortableNode = false
  /** @type {string | null} */
  let portableNodeVersion = null
  if (wantNode) {
    // sync wrapper for tests/callers; ensure-host-dist uses async path when available
    try {
      const result = bundlePortableNodeSync(hostDist)
      hasPortableNode = result.ok
      portableNodeVersion = result.version
    } catch (error) {
      console.warn(`dsh-desktop: portable node sync bundle failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const mode = hasRuntimeDeploy && hasPortableNode
    ? 'product-runtime'
    : 'staged-artifacts'

  const notes = [
    hasRuntimeDeploy
      ? 'runtime/: pnpm-deployed @deepseek-ai/dsh production closure (offline Host JS).'
      : 'runtime/ missing — Host cannot run offline without monorepo bridge.',
    hasPortableNode
      ? `node/: portable Node ${portableNodeVersion ?? ''} bundled for offline boot.`
      : 'node/ missing — system Node still required unless monorepo bridge is used.',
    'apps/cli/lib + apps/web/dist staged as fallback/diagnostics.',
    'Boot: Electron → bundled node (preferred) → run-host.mjs → runtime/lib/bin.js.',
  ]

  const manifest = {
    version: 2,
    mode,
    createdAt: new Date().toISOString(),
    monorepoRoot,
    hasCliBin: true,
    hasWebDist,
    hasCliConfig,
    hasRuntimeDeploy,
    hasPortableNode,
    portableNodeVersion,
    notes,
  }

  writeFileSync(path.join(hostDist, HOST_MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(path.join(hostDist, RUN_HOST_NAME), buildRunHostSource(), 'utf8')
  writeFileSync(
    path.join(hostDist, 'README.host-dist.txt'),
    [
      'DSH Desktop Host runtime layout',
      '',
      `mode: ${mode}`,
      hasRuntimeDeploy ? '- runtime/  (deployed dsh closure)' : '- runtime/  MISSING',
      hasPortableNode ? `- node/     (portable Node ${portableNodeVersion})` : '- node/     MISSING',
      '- apps/cli/lib, apps/web/dist (fallback artifacts)',
      '- run-host.mjs + host-manifest.json',
      '',
    ].join('\n'),
    'utf8',
  )

  return {
    hostDist,
    manifest,
    staged: true,
  }
}

/**
 * Synchronous portable node bundling using child_process curl/powershell download fallbacks.
 * Prefer async bundlePortableNode from ensure-host-dist.
 * @param {string} hostDist
 */
export function bundlePortableNodeSync(hostDist) {
  // For unit tests / constrained environments, allow skip via env.
  if (process.env.DSH_DESKTOP_SKIP_PORTABLE_NODE === '1') {
    return { ok: false, version: null }
  }
  const version = process.version.replace(/^v/, '')
  const platform = process.platform
  const arch = process.arch
  const { url, archiveName, kind } = (() => {
    const triple = nodePlatformTriple(platform, arch)
    const k = platform === 'win32' ? 'zip' : 'tar.gz'
    const name = `node-v${version}-${triple}.${k}`
    const mirror = (process.env.DSH_DESKTOP_NODE_MIRROR ?? process.env.NODEJS_ORG_MIRROR ?? 'https://npmmirror.com/mirrors/node').replace(/\/$/, '')
    return { url: `${mirror}/v${version}/${name}`, archiveName: name, kind: k }
  })()

  const nodeRoot = path.join(hostDist, NODE_DIR_NAME)
  rmSync(nodeRoot, { recursive: true, force: true })
  mkdirSync(nodeRoot, { recursive: true })
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'dsh-node-dist-'))
  const archivePath = path.join(tmp, archiveName)
  try {
    // Use powershell Invoke-WebRequest on Windows; curl elsewhere.
    if (process.platform === 'win32') {
      execFileSync(
        'powershell.exe',
        ['-NoProfile', '-Command', `Invoke-WebRequest -Uri '${url.replace(/'/g, "''")}' -OutFile '${archivePath.replace(/'/g, "''")}'`],
        { stdio: 'inherit', windowsHide: true },
      )
      execFileSync(
        'powershell.exe',
        ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${archivePath.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force`],
        { stdio: 'inherit', windowsHide: true },
      )
    } else {
      execFileSync('curl', ['-fsSL', url, '-o', archivePath], { stdio: 'inherit' })
      execFileSync('tar', ['-xzf', archivePath, '-C', tmp], { stdio: 'inherit' })
    }
    const extracted = path.join(tmp, `node-v${version}-${nodePlatformTriple(platform, arch)}`)
    if (!existsSync(extracted)) throw new Error(`missing extracted tree ${extracted}`)
    copyTree(extracted, nodeRoot)
    const bin = resolveBundledNodePath(hostDist)
    if (!existsSync(bin)) throw new Error(`missing node binary ${bin}`)
    return { ok: true, version }
  } catch (error) {
    console.warn(`dsh-desktop: portable Node sync failed: ${error instanceof Error ? error.message : String(error)}`)
    rmSync(nodeRoot, { recursive: true, force: true })
    return { ok: false, version: null }
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

export function readHostManifest(hostRoot) {
  const file = path.join(hostRoot, HOST_MANIFEST_NAME)
  if (!existsSync(file)) return null
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { return null }
}

export function makeTempDir(prefix = 'dsh-host-dist-') {
  return mkdtempSync(path.join(os.tmpdir(), prefix))
}

export function isDirectory(dir) {
  try { return statSync(dir).isDirectory() } catch { return false }
}
