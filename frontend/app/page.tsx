"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { fetchGeneration } from "@/lib/api";
import { computeMetrics, computeSummaryStats } from "@/lib/metrics";
import type { AccuracyMetrics, SummaryStats } from "@/lib/metrics";
import GenerationChart from "@/components/GenerationChart";
import Controls from "@/components/Controls";
import AccuracyPanel from "@/components/AccuracyPanel";
import SummaryStatsPanel from "@/components/SummaryStatsPanel";
import ExportBar from "@/components/ExportBar";
import type { GenerationDataPoint, CompareDataPoint } from "@/types/generation";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function errorSubtext(message: string): string {
  if (message.includes("404")) return "No data found for this date range.";
  if (message.includes("500")) return "The data service is temporarily unavailable.";
  return "Check your connection and try again.";
}

const WIND_QUOTES: { text: string; author: string }[] = [
  { text: "Powered by possibility.", author: "" },
  { text: "Where nature meets necessity.", author: "" },
  { text: "The future moves with the wind.", author: "" },
  { text: "Energy doesn't have to be taken. It can be borrowed from the wind.", author: "" },
  { text: "Not all power needs a source you can see.", author: "" },
  { text: "Energy, the way it should be.", author: "" },
  { text: "What moves freely, powers freely.", author: "" },
  { text: "The wind was never out of reach.", author: "" },
  { text: "Every wind turbine is a monument to human ingenuity.", author: "" },
  { text: "The answer is blowin' in the wind.", author: "Bob Dylan" },
] as const;

type WindQuote = (typeof WIND_QUOTES)[number];

export default function Home() {
  const [quote, setQuote] = useState(WIND_QUOTES[0])
useEffect(() => {
  setQuote(WIND_QUOTES[Math.floor(Math.random() * WIND_QUOTES.length)])
}, []);
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

  const [isLive, setIsLive] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs so loadData always reads the latest from/to without stale closures
  const fromRef = useRef(from);
  const toRef = useRef(to);
  useEffect(() => { fromRef.current = from; }, [from]);
  useEffect(() => { toRef.current = to; }, [to]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    setCompareData([]);

    fetchGeneration(fromRef.current, toRef.current, horizonHours)
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [horizonHours]); // from/to read via refs — not needed in deps

  // Fire loadData after quick-select state has settled
  useEffect(() => {
    if (shouldFetch) {
      setShouldFetch(false);
      loadData();
    }
  }, [shouldFetch, loadData]);

  const fetchCompareData = useCallback(async () => {
    setCompareLoading(true);
    setError(null);

    try {
      const [dataA, dataB] = await Promise.all([
        fetchGeneration(fromRef.current, toRef.current, horizonHours),
        fetchGeneration(fromRef.current, toRef.current, horizonHoursB),
      ]);

      const mergedMap = new Map<string, CompareDataPoint>();

      for (const point of dataA.data) {
        mergedMap.set(point.time, {
          time: point.time,
          actual: point.actual,
          forecastA: point.forecast,
          forecastB: 0,
        });
      }

      for (const point of dataB.data) {
        const existing = mergedMap.get(point.time);
        if (existing) {
          existing.forecastB = point.forecast;
        } else {
          mergedMap.set(point.time, {
            time: point.time,
            actual: point.actual,
            forecastA: 0,
            forecastB: point.forecast,
          });
        }
      }

      const merged = Array.from(mergedMap.values())
        .filter((p) => p.forecastA !== 0 && p.forecastB !== 0)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      setCompareData(merged);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setCompareLoading(false);
    }
  }, [horizonHours, horizonHoursB]);

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

  // Bug 2 fix: set shouldFetch instead of calling onApply directly
  const handleQuickSelect = useCallback((f: string, t: string) => {
    setFrom(f);
    setTo(t);
    setIsLive(false);
    setShouldFetch(true);
  }, []);

  const handleLiveToggle = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live mode: 24h window (yesterday → today), refresh every 15 minutes
  useEffect(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }

    if (isLive) {
      const today = todayStr();
      const yesterday = daysAgoStr(1);
      // Set state + refs directly so loadData() below reads fresh values
      setFrom(yesterday);
      setTo(today);
      fromRef.current = yesterday;
      toRef.current = today;
      loadData();

      liveIntervalRef.current = setInterval(() => {
        const t = todayStr();
        const y = daysAgoStr(1);
        setFrom(y);
        setTo(t);
        fromRef.current = y;
        toRef.current = t;
        loadData();
      }, 15 * 60 * 1000);
    }

    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

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
            onFromChange={(v) => { setFrom(v); if (isLive) setIsLive(false); }}
            onToChange={(v) => { setTo(v); if (isLive) setIsLive(false); }}
            onHorizonChange={(v) => { setHorizonHours(v); if (isLive) setIsLive(false); }}
            onApply={handleApply}
            loading={loading}
            compareMode={compareMode}
            onCompareModeToggle={handleCompareModeToggle}
            horizonHoursB={horizonHoursB}
            onHorizonBChange={setHorizonHoursB}
            compareLoading={compareLoading}
            onQuickSelect={handleQuickSelect}
            isLive={isLive}
            onLiveToggle={handleLiveToggle}
          />
        </div>

        <div className="mx-0 mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white pl-0 pr-0 pt-2 pb-2 sm:pl-2 sm:pr-2shadow-sm sm:mx-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">          {/* Skeleton loader */}
          {isLoading && (
            <div className="rounded-xl p-4">
              <div className="mb-4 h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mb-4 h-80 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="mx-4 flex h-96 flex-col items-center justify-center gap-3 sm:mx-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <span className="text-lg font-bold text-red-500">✕</span>
              </div>
              <p className="text-sm font-medium text-red-400">Failed to load data</p>
              <p className="text-xs text-zinc-500">{errorSubtext(error)}</p>
              <button
                onClick={handleApply}
                className="mt-1 rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && !hasData && (
            <p className="py-20 text-center text-zinc-400">
              No data available for the selected range.
            </p>
          )}

          {/* Data state */}
          {!isLoading && !error && hasData && (
            <>
              <div id="generation-chart-container">
                <GenerationChart
                  data={data}
                  multiDay={multiDay}
                  compareData={compareData.length > 0 ? compareData : undefined}
                />
              </div>
              <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {compareMode
                  ? `Compare mode | Horizon A: ${horizonHours}h · Horizon B: ${horizonHoursB}h`
                  : `Showing ${data.length} data points | Horizon: ${horizonHours}h`}
              </p>
              <ExportBar
                data={data}
                compareData={compareData}
                from={from}
                to={to}
                compareMode={compareMode}
              />
              {!compareMode && (
                <>
                  <AccuracyPanel metrics={metrics} />
                  <SummaryStatsPanel stats={summaryStats} />
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-6 px-4 pb-6 text-center">
          <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
            &ldquo;{quote.text}&rdquo;
          </p>
          {quote.author && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-600">
              — {quote.author}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
