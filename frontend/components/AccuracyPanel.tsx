"use client";

import { useState } from "react";
import type { AccuracyMetrics } from "@/lib/metrics";

interface AccuracyPanelProps {
  metrics: AccuracyMetrics | null;
}

function signedMW(value: number): string {
  if (value < 0) return `−${Math.abs(value).toLocaleString()} MW`;
  return `+${value.toLocaleString()} MW`;
}

function signedPct(value: number): string {
  if (value < 0) return `−${Math.abs(parseFloat(value.toFixed(1)))}%`;
  return `+${parseFloat(value.toFixed(1))}%`;
}

const cardBase = "bg-white/5 rounded-lg p-4 border border-white/10";
const cardLabel = "text-xs text-gray-400 mb-1";
const cardSubtext = "text-xs text-gray-500 mt-1";
const advCardBase = "bg-white/5 rounded-lg p-3 border-l-2 border-white/20";
const advCardLabel = "text-xs text-gray-400 mb-1";
const advCardValue = "text-lg font-medium text-white";

export default function AccuracyPanel({ metrics }: AccuracyPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!metrics) return null;

  const biasColor =
    Math.abs(metrics.meanError) > 200 ? "text-amber-400" : "text-white";

  return (
    <div className="mt-6 px-2 sm:px-0">
      {/* Section 1 — core metrics */}
      <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
        Forecast Accuracy
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* MAE */}
        <div className={cardBase}>
          <p className={cardLabel}>MAE</p>
          <p className="text-xl font-medium text-white">
            {metrics.mae.toLocaleString()} MW
          </p>
          <p className={cardSubtext}>Avg absolute deviation</p>
        </div>

        {/* Mean error / bias */}
        <div className={cardBase}>
          <p className={cardLabel}>Mean error (bias)</p>
          <p className={`text-xl font-medium ${biasColor}`}>
            {signedMW(metrics.meanError)}
          </p>
          <p className={cardSubtext}>
            {metrics.meanError < 0
              ? "Negative = under-forecast"
              : "Positive = over-forecast"}
          </p>
        </div>

        {/* P99 */}
        <div className={cardBase}>
          <p className={cardLabel}>P99 absolute error</p>
          <p className="text-xl font-medium text-white">
            {metrics.p99AbsError.toLocaleString()} MW
          </p>
          <p className={cardSubtext}>Worst 1% of errors</p>
        </div>
      </div>

      <hr className="my-4 border-white/10" />

      {/* Section 2 — advanced toggle */}
      <button
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="bg-transparent text-sm text-gray-400 border border-white/10 rounded-md px-3 py-2 hover:bg-white/5 transition"
      >
        {showAdvanced ? "Hide advanced analysis ▲" : "Advanced analysis ▼"}
      </button>

      {showAdvanced && (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* A */}
            <div className={advCardBase}>
              <p className={advCardLabel}>MAE as % of mean actual</p>
              <p className={advCardValue}>{metrics.maePercent.toFixed(1)}%</p>
            </div>

            {/* B */}
            <div className={advCardBase}>
              <p className={advCardLabel}>RMSE</p>
              <p className={advCardValue}>{metrics.rmse.toLocaleString()} MW</p>
            </div>

            {/* C */}
            <div className={advCardBase}>
              <p className={advCardLabel}>Median absolute error</p>
              <p className={advCardValue}>
                {metrics.medianAbsError.toLocaleString()} MW
              </p>
            </div>

            {/* D */}
            <div className={advCardBase}>
              <p className={advCardLabel}>Mean % error</p>
              <p className={advCardValue}>
                {signedPct(metrics.meanPercentError)}
              </p>
            </div>

            {/* E — full width */}
            <div className={`${advCardBase} sm:col-span-2`}>
              <p className={advCardLabel}>Std of error</p>
              <p className={advCardValue}>
                {metrics.stdError.toLocaleString()} MW
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-600">
            Computed from {metrics.count} settlement periods
          </p>
        </>
      )}
    </div>
  );
}
