"use client";

import { useCallback, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { fetchGeneration } from "@/lib/api";
import { computeMetrics, computeSummaryStats } from "@/lib/metrics";
import type { AccuracyMetrics, SummaryStats } from "@/lib/metrics";
import GenerationChart from "@/components/GenerationChart";
import Controls from "@/components/Controls";
import AccuracyPanel from "@/components/AccuracyPanel";
import SummaryStatsPanel from "@/components/SummaryStatsPanel";
import type { GenerationDataPoint, CompareDataPoint } from "@/types/generation";

export default function Home() {
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2025-01-01");
  const [horizonHours, setHorizonHours] = useState(4);
  const [data, setData] = useState<GenerationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [horizonHoursB, setHorizonHoursB] = useState(24);
  const [compareData, setCompareData] = useState<CompareDataPoint[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    setCompareData([]);

    fetchGeneration(from, to, horizonHours)
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [from, to, horizonHours]);

  const fetchCompareData = useCallback(async () => {
    setCompareLoading(true);
    setError(null);

    try {
      const [dataA, dataB] = await Promise.all([
        fetchGeneration(from, to, horizonHours),
        fetchGeneration(from, to, horizonHoursB),
      ]);

      const bByTime = new Map(dataB.data.map((pt) => [pt.time, pt]));

      const merged: CompareDataPoint[] = dataA.data.map((ptA) => {
        const ptB = bByTime.get(ptA.time);
        return {
          time: ptA.time,
          actual: ptA.actual,
          forecastA: ptA.forecast,
          forecastB: ptB?.forecast ?? 0,
        };
      });

      setCompareData(merged);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setCompareLoading(false);
    }
  }, [from, to, horizonHours, horizonHoursB]);

  const handleApply = useCallback(() => {
    if (compareMode) {
      void fetchCompareData();
    } else {
      loadData();
    }
  }, [compareMode, fetchCompareData, loadData]);

  const handleCompareModeToggle = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) setCompareData([]);
      return !prev;
    });
  }, []);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const multiDay = from !== to;
  const metrics: AccuracyMetrics | null =
    data.length > 0 ? computeMetrics(data) : null;
  const summaryStats: SummaryStats | null =
    data.length > 0 ? computeSummaryStats(data) : null;

  const isLoading = loading || compareLoading;
  const hasData = compareData.length > 0 || data.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-6xl px-1.5 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          UK Wind Power Forecast Monitor
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Comparing actual vs forecasted national wind generation
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Controls
            from={from}
            to={to}
            horizonHours={horizonHours}
            onFromChange={setFrom}
            onToChange={setTo}
            onHorizonChange={setHorizonHours}
            onApply={handleApply}
            loading={loading}
            compareMode={compareMode}
            onCompareModeToggle={handleCompareModeToggle}
            horizonHoursB={horizonHoursB}
            onHorizonBChange={setHorizonHoursB}
            compareLoading={compareLoading}
          />
        </div>

        <div className="mx-0 mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-sm sm:mx-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {isLoading && (
            <div className="mx-4 h-96 animate-pulse rounded-lg bg-zinc-100 sm:mx-0 dark:bg-zinc-800" />
          )}

          {!isLoading && error && (
            <div className="mx-4 flex h-96 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 sm:mx-0 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Failed to load data. Please check your connection and try again.
              </p>
              <button
                onClick={handleApply}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && !hasData && (
            <p className="py-20 text-center text-zinc-400">
              No data available for the selected range.
            </p>
          )}

          {!isLoading && !error && hasData && (
            <>
              <GenerationChart
                data={data}
                multiDay={multiDay}
                compareData={compareData.length > 0 ? compareData : undefined}
              />
              <p className="mt-4 px-4 text-center text-sm text-zinc-500 sm:px-0 dark:text-zinc-400">
                {compareMode
                  ? `Compare mode | Horizon A: ${horizonHours}h · Horizon B: ${horizonHoursB}h`
                  : `Showing ${data.length} data points | Horizon: ${horizonHours}h`}
              </p>
              {!compareMode && (
                <>
                  <AccuracyPanel metrics={metrics} />
                  <SummaryStatsPanel stats={summaryStats} />
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
