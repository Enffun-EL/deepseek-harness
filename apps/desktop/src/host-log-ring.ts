/**
 * Bounded in-memory ring of Host log lines for crash dialogs and diagnostics.
 * Avoids unbounded string growth while keeping a recent tail for operators.
 */

/** One captured Host output line. */
export interface HostLogEntry {
  /** Origin stream. */
  stream: 'stdout' | 'stderr'
  /** Line text without trailing newline. */
  line: string
  /** Monotonic capture time (ms since Unix epoch). */
  at: number
}

/** Default capacity: enough for crash context without large retained heaps. */
export const DEFAULT_HOST_LOG_RING_CAPACITY = 400

/**
 * Fixed-capacity ring buffer of Host log lines.
 */
export class HostLogRing {
  private readonly entries: HostLogEntry[] = []
  private readonly capacity: number

  /**
   * @param capacity - max retained lines (oldest dropped first); must be >= 1
   */
  constructor(capacity: number = DEFAULT_HOST_LOG_RING_CAPACITY) {
    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new Error(`dsh-desktop: HostLogRing capacity must be >= 1, got ${String(capacity)}`)
    }
    this.capacity = Math.floor(capacity)
  }

  /**
   * Append one line, dropping the oldest when full.
   * @param stream - stdout or stderr
   * @param line - single log line
   * @param at - optional timestamp (defaults to `Date.now()`)
   */
  push(stream: 'stdout' | 'stderr', line: string, at: number = Date.now()): void {
    this.entries.push({ stream, line, at })
    if (this.entries.length > this.capacity) {
      this.entries.splice(0, this.entries.length - this.capacity)
    }
  }

  /**
   * @returns current number of retained lines
   */
  get size(): number {
    return this.entries.length
  }

  /**
   * @returns max retained lines
   */
  get maxCapacity(): number {
    return this.capacity
  }

  /**
   * Snapshot of retained entries (oldest first).
   * @returns shallow copy of the ring contents
   */
  snapshot(): readonly HostLogEntry[] {
    return this.entries.slice()
  }

  /**
   * Format retained lines for dialogs / error tails.
   * @returns multi-line text, oldest first
   */
  toText(): string {
    return this.entries.map(entry => `[${entry.stream}] ${entry.line}`).join('\n')
  }

  /**
   * Drop all retained lines (e.g. after a successful stable restart).
   */
  clear(): void {
    this.entries.length = 0
  }
}
