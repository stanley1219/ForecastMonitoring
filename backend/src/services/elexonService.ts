import type {
  ActualDataPoint,
  ActualRecord,
  ForecastDataPoint,
  ForecastRecord
} from "../types/elexon";

const BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";

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

export async function fetchActuals(from: string, to: string): Promise<ActualDataPoint[]> {
  try {
    const url = new URL(`${BASE_URL}/datasets/FUELHH/stream`);
    url.searchParams.set("settlementDateFrom", from);
    url.searchParams.set("settlementDateTo", to);

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Elexon actuals fetch failed", {
        status: res.status,
        statusText: res.statusText
      });
      return [];
    }

    const json: unknown = await res.json();
    const rows = extractFlatArray(json);

    return rows
      .filter(isActualRecord)
      .filter((r) => r.fuelType === "WIND")
      .map((r) => ({ time: r.startTime, generation: r.generation }));
  } catch (err) {
    console.error("Elexon actuals fetch error", err);
    return [];
  }
}

export async function fetchForecasts(
  from: string,
  to: string
): Promise<ForecastDataPoint[]> {
  try {
    const url = new URL(`${BASE_URL}/datasets/WINDFOR/stream`);
    url.searchParams.set("publishDateTimeFrom", from);
    url.searchParams.set("publishDateTimeTo", to);

    const res = await fetch(url);
    if (!res.ok) {
      console.error("Elexon forecasts fetch failed", {
        status: res.status,
        statusText: res.statusText
      });
      return [];
    }

    const json: unknown = await res.json();
    const rows = extractFlatArray(json);

    const publishCutoffMs = Date.parse("2025-01-01T00:00:00.000Z");
    const maxHorizonMs = 48 * 60 * 60 * 1000;

    return rows
      .filter(isForecastRecord)
      .filter((r) => {
        const publishMs = Date.parse(r.publishTime);
        return Number.isFinite(publishMs) && publishMs >= publishCutoffMs;
      })
      .filter((r) => {
        const startMs = Date.parse(r.startTime);
        const publishMs = Date.parse(r.publishTime);
        if (!Number.isFinite(startMs) || !Number.isFinite(publishMs)) return false;
        const horizonMs = startMs - publishMs;
        return horizonMs >= 0 && horizonMs <= maxHorizonMs;
      })
      .map((r) => ({
        time: r.startTime,
        publishTime: r.publishTime,
        generation: r.generation
      }));
  } catch (err) {
    console.error("Elexon forecasts fetch error", err);
    return [];
  }
}

