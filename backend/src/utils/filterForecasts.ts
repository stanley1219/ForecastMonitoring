import type { ActualDataPoint, ForecastDataPoint } from "../types/elexon.js";

export function applyHorizonFilter(
  actuals: ActualDataPoint[],
  forecasts: ForecastDataPoint[],
  horizonHours: number
): { time: string; actual: number; forecast: number }[] {
  const horizonMs = horizonHours * 3600 * 1000;

  const forecastsByTime = new Map<string, ForecastDataPoint[]>();
  for (const f of forecasts) {
    const list = forecastsByTime.get(f.time);
    if (list) list.push(f);
    else forecastsByTime.set(f.time, [f]);
  }

  const out: { time: string; actual: number; forecast: number }[] = [];

  for (const a of actuals) {
    const targetMs = Date.parse(a.time);
    if (!Number.isFinite(targetMs)) continue;

    const cutoff = targetMs - horizonMs;

    const candidates = forecastsByTime.get(a.time);
    if (!candidates || candidates.length === 0) continue;

    let best: ForecastDataPoint | undefined;
    let bestPublishMs = -Infinity;

    for (const f of candidates) {
      const publishMs = Date.parse(f.publishTime);
      if (!Number.isFinite(publishMs)) continue;
      if (publishMs > cutoff) continue;

      if (publishMs > bestPublishMs) {
        bestPublishMs = publishMs;
        best = f;
      }
    }

    if (!best) continue;

    out.push({
      time: a.time,
      actual: a.generation,
      forecast: best.generation
    });
  }

  out.sort((x, y) => Date.parse(x.time) - Date.parse(y.time));
  return out;
}

