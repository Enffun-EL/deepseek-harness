import { describe, expect, it } from 'vitest'
import {
  MISSING_NODE_MESSAGE_ZH,
  formatHostStartErrorDetail,
  isMissingNodeError,
  isMissingNodeMessage,
} from '../src/missing-node.js'

describe('isMissingNodeError', () => {
  it('detects spawn ENOENT for node', () => {
    const err = Object.assign(new Error('spawn node ENOENT'), {
      code: 'ENOENT',
      syscall: 'spawn',
      path: 'node',
    })
    expect(isMissingNodeError(err)).toBe(true)
  })

  it('detects Windows “not recognized” messages', () => {
    expect(
      isMissingNodeError(
        new Error("'node' is not recognized as an internal or external command"),
      ),
    ).toBe(true)
  })

  it('rejects unrelated failures', () => {
    expect(isMissingNodeError(new Error('Host exited before readiness'))).toBe(false)
    expect(isMissingNodeError(new Error('timed out after 120000ms'))).toBe(false)
  })
})

describe('isMissingNodeMessage', () => {
  it('matches the Chinese product string', () => {
    expect(isMissingNodeMessage(MISSING_NODE_MESSAGE_ZH)).toBe(true)
  })
})

describe('formatHostStartErrorDetail', () => {
  it('rewrites missing Node errors to Chinese product copy', () => {
    const err = Object.assign(new Error('spawn node ENOENT'), {
      code: 'ENOENT',
      syscall: 'spawn',
      path: 'node',
    })
    expect(formatHostStartErrorDetail(err)).toBe(MISSING_NODE_MESSAGE_ZH)
  })

  it('preserves ordinary Error messages', () => {
    expect(formatHostStartErrorDetail(new Error('Host exited before readiness'))).toBe(
      'Host exited before readiness',
    )
  })
})
