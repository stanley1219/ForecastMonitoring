"use client";

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
}

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

const MIN_DATE = new Date(2025, 0, 1);
const MAX_DATE = new Date();

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 " +
  "dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

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
}: ControlsProps) {
  const isApplyLoading = loading || compareLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative z-30 flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Start Date
          </label>
          <DatePicker
            selected={toDate(from)}
            onChange={(date: Date | null) => {
              if (date) onFromChange(toDateString(date));
            }}
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
            onChange={(date: Date | null) => {
              if (date) onToChange(toDateString(date));
            }}
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

      {compareMode && (
        <div className="flex-1">
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
  );
}
