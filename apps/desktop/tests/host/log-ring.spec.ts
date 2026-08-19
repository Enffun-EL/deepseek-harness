import { describe, expect, it } from 'vitest'
import { HostLogRing } from '../../src/host/log-ring.js'

describe('HostLogRing', () => {
  it('retains lines in order and drops the oldest when full', () => {
    const ring = new HostLogRing(3)
    ring.push('stdout', 'a', 1)
    ring.push('stderr', 'b', 2)
    ring.push('stdout', 'c', 3)
    ring.push('stdout', 'd', 4)

    expect(ring.size).toBe(3)
    expect(ring.maxCapacity).toBe(3)
    expect(ring.snapshot().map(e => e.line)).toEqual(['b', 'c', 'd'])
    expect(ring.toText()).toBe('[stderr] b\n[stdout] c\n[stdout] d')
  })

  it('clears retained lines', () => {
    const ring = new HostLogRing(2)
    ring.push('stdout', 'x')
    ring.clear()
    expect(ring.size).toBe(0)
    expect(ring.toText()).toBe('')
  })

  it('rejects non-positive capacity', () => {
    expect(() => new HostLogRing(0)).toThrow(/capacity/)
    expect(() => new HostLogRing(-1)).toThrow(/capacity/)
  })
})
