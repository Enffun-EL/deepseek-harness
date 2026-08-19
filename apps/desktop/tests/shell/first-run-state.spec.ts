import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  FIRST_RUN_STATE_FILE,
  isFirstLaunch,
  markFirstLaunchCompleted,
  readShellState,
  shellStatePath,
} from '../../src/shell/first-run-state.js'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function tempUserData(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'dsh-desktop-first-run-'))
  temps.push(dir)
  return dir
}

describe('first-run-state', () => {
  it('treats a missing state file as first launch', () => {
    const dir = tempUserData()
    expect(isFirstLaunch(dir)).toBe(true)
    expect(readShellState(dir)).toEqual({ hasCompletedFirstLaunch: false })
    expect(shellStatePath(dir)).toBe(path.join(dir, FIRST_RUN_STATE_FILE))
  })

  it('persists completion and clears the first-launch flag', () => {
    const dir = tempUserData()
    markFirstLaunchCompleted(dir)
    expect(isFirstLaunch(dir)).toBe(false)
    expect(readShellState(dir)).toEqual({ hasCompletedFirstLaunch: true })
  })

  it('treats corrupt JSON as first launch not completed', () => {
    const dir = tempUserData()
    writeFileSync(shellStatePath(dir), '{not-json', 'utf8')
    expect(isFirstLaunch(dir)).toBe(true)
  })

  it('ignores non-boolean hasCompletedFirstLaunch values', () => {
    const dir = tempUserData()
    writeFileSync(
      shellStatePath(dir),
      `${JSON.stringify({ hasCompletedFirstLaunch: 'yes' })}\n`,
      'utf8',
    )
    expect(readShellState(dir).hasCompletedFirstLaunch).toBe(false)
  })
})
