import { describe, expect, it } from 'vitest'
import { progressPercent, type ProgressItem } from '../src/progress.ts'

function item(content: string, status: ProgressItem['status']): ProgressItem {
  return { content, status }
}

describe('progressPercent', () => {
  it('returns 0 for an empty list', () => {
    expect(progressPercent([])).toBe(0)
  })

  it('returns 0 when nothing is completed', () => {
    expect(progressPercent([
      item('a', 'pending'),
      item('b', 'in_progress'),
    ])).toBe(0)
  })

  it('returns 100 when every item is completed', () => {
    expect(progressPercent([
      item('a', 'completed'),
      item('b', 'completed'),
    ])).toBe(100)
  })

  it('floors the completed ratio to a whole percent', () => {
    // 1/3 → 33.333… → 33
    expect(progressPercent([
      item('a', 'completed'),
      item('b', 'pending'),
      item('c', 'in_progress'),
    ])).toBe(33)
  })

  it('counts only completed rows toward the numerator', () => {
    expect(progressPercent([
      item('a', 'completed'),
      item('b', 'completed'),
      item('c', 'in_progress'),
      item('d', 'pending'),
    ])).toBe(50)
  })
})
