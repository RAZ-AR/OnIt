export interface DebouncedBatch<T> {
  key: string;
  items: T[];
  firstAt: number;
  lastAt: number;
}

/**
 * Batches rapid multi-message bursts from the same chat (e.g. text + 2 photos + voice note)
 * into a single triage invocation after `windowMs` of inactivity.
 */
export class MessageDebouncer<T> {
  private readonly pending = new Map<
    string,
    {
      items: T[];
      firstAt: number;
      lastAt: number;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  constructor(
    private readonly windowMs: number,
    private readonly onFlush: (batch: DebouncedBatch<T>) => void | Promise<void>
  ) {}

  push(key: string, item: T, now = Date.now()): void {
    const existing = this.pending.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.items.push(item);
      existing.lastAt = now;
      existing.timer = setTimeout(() => {
        void this.flushKey(key);
      }, this.windowMs);
      return;
    }

    const timer = setTimeout(() => {
      void this.flushKey(key);
    }, this.windowMs);

    this.pending.set(key, {
      items: [item],
      firstAt: now,
      lastAt: now,
      timer,
    });
  }

  async flushKey(key: string): Promise<void> {
    const entry = this.pending.get(key);
    if (!entry) return;
    clearTimeout(entry.timer);
    this.pending.delete(key);
    await this.onFlush({
      key,
      items: entry.items,
      firstAt: entry.firstAt,
      lastAt: entry.lastAt,
    });
  }

  async flushAll(): Promise<void> {
    const keys = Array.from(this.pending.keys());
    for (const key of keys) {
      await this.flushKey(key);
    }
  }

  pendingCount(): number {
    return this.pending.size;
  }
}
