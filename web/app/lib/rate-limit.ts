type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();
const MAX_ENTRIES = 10_000;
let nextCleanupAt = 0;

function cleanup(now: number) {
  if (now < nextCleanupAt && store.size < MAX_ENTRIES) return;

  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size > MAX_ENTRIES) {
    const overflow = store.size - MAX_ENTRIES;
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }

  nextCleanupAt = now + 10_000;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return 'unknown';
}

export function buildRateLimitKey(scope: string, request: Request, actorId?: string): string {
  const ip = getClientIp(request);
  const actor = String(actorId || '').trim() || 'anon';
  return `${scope}:${ip}:${actor}`;
}

export function checkRateLimit(params: { key: string; limit: number; windowMs: number }): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  cleanup(now);

  const existing = store.get(params.key);
  if (!existing || existing.resetAt <= now) {
    store.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, params.limit - 1),
      retryAfterSeconds: Math.ceil(params.windowMs / 1000),
    };
  }

  if (existing.count >= params.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(params.key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, params.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
