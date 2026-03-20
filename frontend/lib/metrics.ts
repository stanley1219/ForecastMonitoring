export interface AccuracyMetrics {
  mae: number;
  meanError: number;
  p99AbsError: number;
  maePercent: number;
  rmse: number;
  medianAbsError: number;
  meanPercentError: number;
  stdError: number;
  count: number;
}

function sum(arr: number[]): number {
  return arr.reduce((acc, v) => acc + v, 0);
}

function median(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

export function computeMetrics(
  data: { actual: number; forecast: number }[]
): AccuracyMetrics | null {
  const valid = data.filter(
    (d) =>
      d.actual != null &&
      d.forecast != null &&
      !Number.isNaN(d.actual) &&
      !Number.isNaN(d.forecast)
  );

  if (valid.length === 0) return null;

  const n = valid.length;
  const errors = valid.map((d) => d.forecast - d.actual);
  const absErrors = errors.map(Math.abs);

  const mae = sum(absErrors) / n;
  const meanError = sum(errors) / n;
  const meanActual = sum(valid.map((d) => d.actual)) / n;
  const rmse = Math.sqrt(sum(errors.map((e) => e * e)) / n);
  const maePercent = meanActual !== 0 ? (mae / meanActual) * 100 : 0;
  const pctErrors = valid.map((d) =>
    d.actual !== 0 ? ((d.forecast - d.actual) / d.actual) * 100 : 0
  );
  const meanPercentError = sum(pctErrors) / n;
  const stdError = Math.sqrt(
    sum(errors.map((e) => (e - meanError) ** 2)) / n
  );

  const sorted = [...absErrors].sort((a, b) => a - b);
  const medianAbsError = median(sorted);
  const p99AbsError = sorted[Math.min(Math.ceil(0.99 * n) - 1, n - 1)] as number;

  return {
    mae: Math.round(mae),
    meanError: Math.round(meanError),
    p99AbsError: Math.round(p99AbsError),
    maePercent: parseFloat(maePercent.toFixed(1)),
    rmse: Math.round(rmse),
    medianAbsError: Math.round(medianAbsError),
    meanPercentError: parseFloat(meanPercentError.toFixed(1)),
    stdError: Math.round(stdError),
    count: n,
  };
}

export interface SummaryStats {
  peakActual: number;
  peakForecast: number;
  totalEnergyActualMWh: number;
  totalEnergyForecastMWh: number;
  capacityFactorActual: number;
  capacityFactorForecast: number;
  ukWindCapacityMW: number;
}

const UK_WIND_CAPACITY_MW = 28_000;

export function computeSummaryStats(
  data: { time: string; actual: number; forecast: number }[]
): SummaryStats | null {
  const valid = data.filter(
    (d) =>
      d.actual != null &&
      d.forecast != null &&
      !Number.isNaN(d.actual) &&
      !Number.isNaN(d.forecast)
  );

  if (valid.length === 0) return null;

  const n = valid.length;

  const peakActual = Math.round(Math.max(...valid.map((d) => d.actual)));
  const peakForecast = Math.round(Math.max(...valid.map((d) => d.forecast)));

  const totalEnergyActualMWh = parseFloat(
    sum(valid.map((d) => d.actual * 0.5)).toFixed(1)
  );
  const totalEnergyForecastMWh = parseFloat(
    sum(valid.map((d) => d.forecast * 0.5)).toFixed(1)
  );

  const periodHours = n * 0.5;
  const capacityFactorActual = parseFloat(
    ((totalEnergyActualMWh / (UK_WIND_CAPACITY_MW * periodHours)) * 100).toFixed(1)
  );
  const capacityFactorForecast = parseFloat(
    ((totalEnergyForecastMWh / (UK_WIND_CAPACITY_MW * periodHours)) * 100).toFixed(1)
  );

  return {
    peakActual,
    peakForecast,
    totalEnergyActualMWh,
    totalEnergyForecastMWh,
    capacityFactorActual,
    capacityFactorForecast,
    ukWindCapacityMW: UK_WIND_CAPACITY_MW,
  };
}