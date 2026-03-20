"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";

interface ControlsProps {
  from: string;
  to: string;
  horizonHours: number;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onHorizonChange: (val: number) => void;
  onApply: () => void;
  loading: boolean;
  compareMode: boolean;
  onCompareModeToggle: () => void;
  horizonHoursB: number;
  onHorizonBChange: (val: number) => void;
  compareLoading: boolean;
  onQuickSelect: (from: string, to: string) => void;
  isLive: boolean;
  onLiveToggle: () => void;
}

type QuickKey = "today" | "yesterday" | "last7" | "last30";

function toDate(yyyy_mm_dd: string): Date {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateString(d);
}

const MIN_DATE = new Date(2025, 0, 1);
const MAX_DATE = new Date();

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 " +
  "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

function quickBtnClass(active: boolean): string {
  return active
    ? "text-xs px-3 py-1 rounded-md border border-white bg-white text-black transition"
    : "text-xs px-3 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition";
}

export default function Controls({
  from,
  to,
  horizonHours,
  onFromChange,
  onToChange,
  onHorizonChange,
  onApply,
  loading,
  compareMode,
  onCompareModeToggle,
  horizonHoursB,
  onHorizonBChange,
  compareLoading,
  onQuickSelect,
  isLive,
  onLiveToggle,
}: ControlsProps) {
  const isApplyLoading = loading || compareLoading;
  const [activeQuick, setActiveQuick] = useState<QuickKey | null>(null);

  const today = toDateString(new Date());

  function handleQuick(key: QuickKey, f: string, t: string) {
    setActiveQuick(key);
    onQuickSelect(f, t);
    // Do NOT call onApply() here — page.tsx fires fetch via shouldFetch state
  }

  function handleFromChange(date: Date | null) {
    if (!date) return;
    setActiveQuick(null);
    onFromChange(toDateString(date));
  }

  function handleToChange(date: Date | null) {
    if (!date) return;
    setActiveQuick(null);
    onToChange(toDateString(date));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quick-select row */}
      <div className="flex flex-wrap gap-2">
        <button
          className={quickBtnClass(activeQuick === "today")}
          onClick={() => handleQuick("today", today, today)}
        >
          Today
        </button>
        <button
          className={quickBtnClass(activeQuick === "yesterday")}
          onClick={() => handleQuick("yesterday", daysAgo(1), daysAgo(1))}
        >
          Yesterday
        </button>
        <button
          className={quickBtnClass(activeQuick === "last7")}
          onClick={() => handleQuick("last7", daysAgo(6), today)}
        >
          Last 7 days
        </button>
        <button
          className={quickBtnClass(activeQuick === "last30")}
          onClick={() => handleQuick("last30", daysAgo(29), today)}
        >
          Last 30 days
        </button>
        <button
          onClick={onLiveToggle}
          className={
            isLive
              ? "text-xs px-3 py-1 rounded-md border border-red-500 bg-red-500/10 text-red-400 transition"
              : "text-xs px-3 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
          }
        >
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Live
            </span>
          ) : (
            "⬤ Live"
          )}
        </button>
      </div>

      {/* Main controls row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative z-30 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Start Date
          </label>
          <DatePicker
            selected={toDate(from)}
            onChange={handleFromChange}
            dateFormat="yyyy-MM-dd"
            minDate={MIN_DATE}
            maxDate={MAX_DATE}
            className={inputClass}
            popperClassName="!z-50"
          />
        </div>

        <div className="relative z-30 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            End Date
          </label>
          <DatePicker
            selected={toDate(to)}
            onChange={handleToChange}
            dateFormat="yyyy-MM-dd"
            minDate={toDate(from)}
            maxDate={MAX_DATE}
            className={inputClass}
            popperClassName="!z-50"
          />
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {compareMode ? `Horizon A: ${horizonHours}h` : `Forecast Horizon: ${horizonHours}h`}
          </label>
          <input
            type="range"
            min={1}
            max={48}
            step={1}
            value={horizonHours}
            onChange={(e) => onHorizonChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-blue-500 dark:bg-zinc-700"
          />
          {compareMode && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Horizon B: {horizonHoursB}h
              </label>
              <input
                type="range"
                min={1}
                max={48}
                step={1}
                value={horizonHoursB}
                onChange={(e) => onHorizonBChange(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-orange-500 dark:bg-zinc-700"
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={onApply}
            disabled={isApplyLoading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApplyLoading ? "Loading..." : "Apply"}
          </button>
          <button
            onClick={onCompareModeToggle}
            className={
              compareMode
                ? "rounded-md border border-amber-400/50 bg-transparent px-3 py-2 text-sm text-amber-400 transition hover:bg-white/5"
                : "rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5"
            }
          >
            {compareMode ? "Exit compare" : "Compare horizons"}
          </button>
        </div>
      </div>
    </div>
  );
}
