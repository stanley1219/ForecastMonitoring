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
}: ControlsProps) {
  return (
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
          Forecast Horizon: {horizonHours}h
        </label>
        <input
          type="range"
          min={1}
          max={24}
          step={1}
          value={horizonHours}
          onChange={(e) => onHorizonChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-blue-500 dark:bg-zinc-700"
        />
      </div>

      <button
        onClick={onApply}
        disabled={loading}
        className="shrink-0 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Loading..." : "Apply"}
      </button>
    </div>
  );
}
