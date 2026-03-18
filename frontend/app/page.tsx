"use client";

import { useCallback, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { fetchGeneration } from "@/lib/api";
import GenerationChart from "@/components/GenerationChart";
import Controls from "@/components/Controls";
import type { GenerationDataPoint } from "@/types/generation";

export default function Home() {
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState("2025-01-01");
  const [horizonHours, setHorizonHours] = useState(4);
  const [data, setData] = useState<GenerationDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchGeneration(from, to, horizonHours)
      .then((res) => setData(res.data))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [from, to, horizonHours]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const multiDay = from !== to;

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
            onApply={loadData}
            loading={loading}
          />
        </div>

        <div className="mx-0 mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-sm sm:mx-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {loading && (
            <div className="mx-4 h-96 animate-pulse rounded-lg bg-zinc-100 sm:mx-0 dark:bg-zinc-800" />
          )}

          {!loading && error && (
            <div className="mx-4 flex h-96 flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 sm:mx-0 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Failed to load data. Please check your connection and try again.
              </p>
              <button
                onClick={loadData}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <p className="py-20 text-center text-zinc-400">
              No data available for the selected range.
            </p>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              <GenerationChart data={data} multiDay={multiDay} />
              <p className="mt-4 px-4 text-center text-sm text-zinc-500 sm:px-0 dark:text-zinc-400">
                Showing {data.length} data points | Horizon: {horizonHours}h
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
