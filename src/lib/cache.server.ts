const DEFAULT_TTL_MS = 60_000;

type CacheEntry = { value: unknown; expires: number };

const store = new Map<string, CacheEntry>();

export async function getCached<T>(key: string, loader: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function clearDataCache() {
  store.clear();
}
