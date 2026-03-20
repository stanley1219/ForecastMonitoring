import { LRUCache } from "lru-cache";

const TTL_TODAY_MS = 5 * 60 * 1000;      // 5 minutes
const TTL_HISTORY_MS = 60 * 60 * 1000;   // 60 minutes

const cache = new LRUCache<string, unknown>({
  max: 500,
  ttl: TTL_HISTORY_MS,
});

export function getCacheKey(type: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ""}`)
    .join(",");
  return `${type}:${sorted}`;
}

export function isToday(dateStr: string): boolean {
  const now = new Date();
  const todayUTC = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  return dateStr === todayUTC;
}

export function getTTL(toDate: string): number {
  return isToday(toDate) ? TTL_TODAY_MS : TTL_HISTORY_MS;
}

export default cache;
