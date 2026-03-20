import type {
  ActualDataPoint,
  ActualRecord,
  ForecastDataPoint,
  ForecastRecord
} from "../types/elexon.js";
import cache, { getCacheKey, getTTL } from "../utils/cache.js";

const BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";
const TIMEOUT_MS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActualRecord(value: unknown): value is ActualRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.startTime === "string" &&
    typeof value.generation === "number" &&
    typeof value.fuelType === "string"
  );
}

function isForecastRecord(value: unknown): value is ForecastRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.startTime === "string" &&
    typeof value.publishTime === "string" &&
    typeof value.generation === "number"
  );
}

function extractFlatArray(json: unknown): unknown[] {
  return Array.isArray(json) ? json : [];
}

function fetchWithTimeout(url: URL): { promise: Promise<Response>; clear: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return {
    promise: fetch(url, { signal: controller.signal }),
    clear: () => clearTimeout(timeout),
  };
}

export async function fetchActuals(from: string, to: string): Promise<ActualDataPoint[]> {
  const key = getCacheKey("actuals", { from, to });
  const cached = cache.get(key);
  if (cached !== undefined) return cached as ActualDataPoint[];

  const url = new URL(`${BASE_URL}/datasets/FUELHH/stream`);
  url.searchParams.set("settlementDateFrom", from);
  url.searchParams.set("settlementDateTo", to);

  const { promise, clear } = fetchWithTimeout(url);
  try {
    const res = await promise;
    if (!res.ok) {
      console.error("Elexon actuals fetch failed", {
        status: res.status,
        statusText: res.statusText,
      });
      return [];
    }

    const json: unknown = await res.json();
    const rows = extractFlatArray(json);

    const result = rows
      .filter(isActualRecord)
      .filter((r) => r.fuelType === "WIND")
      .map((r) => ({ time: r.startTime, generation: r.generation }));

    cache.set(key, result, { ttl: getTTL(to) });
    return result;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("Elexon request timed out after 10s");
      throw new Error("Elexon actuals request timed out after 10s");
    }
    console.error("Elexon actuals fetch error", err);
    return [];
  } finally {
    clear();
  }
}

export async function fetchForecasts(
  from: string,
  to: string
): Promise<ForecastDataPoint[]> {
  // Use the to param for cache TTL — extract the date part if it's an ISO datetime
  const toDate = to.slice(0, 10);
  const key = getCacheKey("forecasts", { from, to });
  const cached = cache.get(key);
  if (cached !== undefined) return cached as ForecastDataPoint[];

  const url = new URL(`${BASE_URL}/datasets/WINDFOR/stream`);
  url.searchParams.set("publishDateTimeFrom", from);
  url.searchParams.set("publishDateTimeTo", to);

  const { promise, clear } = fetchWithTimeout(url);
  try {
    const res = await promise;
    if (!res.ok) {
      console.error("Elexon forecasts fetch failed", {
        status: res.status,
        statusText: res.statusText,
      });
      return [];
    }

    const json: unknown = await res.json();
    const rows = extractFlatArray(json);

    const publishCutoffMs = Date.parse("2025-01-01T00:00:00.000Z");

    const result = rows
      .filter(isForecastRecord)
      .filter((r) => {
        const publishMs = Date.parse(r.publishTime);
        return Number.isFinite(publishMs) && publishMs >= publishCutoffMs;
      })
      .map((r) => ({
        time: r.startTime,
        publishTime: r.publishTime,
        generation: r.generation,
      }));

    cache.set(key, result, { ttl: getTTL(toDate) });
    return result;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("Elexon request timed out after 10s");
      throw new Error("Elexon forecasts request timed out after 10s");
    }
    console.error("Elexon forecasts fetch error", err);
    return [];
  } finally {
    clear();
  }
}
