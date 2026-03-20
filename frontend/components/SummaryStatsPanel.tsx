"use client";

import type { SummaryStats } from "@/lib/metrics";

interface SummaryStatsPanelProps {
  stats: SummaryStats | null;
}

const cardBase = "bg-white/5 rounded-lg p-4 border border-white/10";
const cardLabel = "text-xs text-gray-400 mb-1";
const cardValue = "text-xl font-medium text-white";
const cardSecondary = "mt-1 text-xs text-gray-500";

export default function SummaryStatsPanel({ stats }: SummaryStatsPanelProps) {
  if (!stats) return null;

  return (
    <div className="mt-6 px-2 sm:px-0">
      <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
        Generation Summary
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Peak Generation */}
        <div className={cardBase}>
          <p className={cardLabel}>Peak generation</p>
          <p className={cardValue}>{stats.peakActual.toLocaleString()} MW</p>
          <p className={cardSecondary}>
            Forecast: {stats.peakForecast.toLocaleString()} MW
          </p>
        </div>

        {/* Total Energy */}
        <div className={cardBase}>
          <p className={cardLabel}>Total energy</p>
          <p className={cardValue}>
            {stats.totalEnergyActualMWh.toLocaleString()} MWh
          </p>
          <p className={cardSecondary}>
            Forecast: {stats.totalEnergyForecastMWh.toLocaleString()} MWh
          </p>
        </div>

        {/* Capacity Factor */}
        <div className={cardBase}>
          <p className={cardLabel}>Capacity factor</p>
          <p className={cardValue}>{stats.capacityFactorActual.toFixed(1)}%</p>
          <p className={cardSecondary}>
            Forecast: {stats.capacityFactorForecast.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-gray-600">vs 28 GW installed</p>
        </div>
      </div>
    </div>
  );
}
