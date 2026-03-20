"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { GenerationDataPoint, CompareDataPoint } from "@/types/generation";

interface GenerationChartProps {
  data: GenerationDataPoint[];
  multiDay: boolean;
  compareData?: CompareDataPoint[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTooltipLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });
}

function formatMW(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

// ── Shared static config ──────────────────────────────────────────────────────

const xAxisLabel = {
  value: "Target End Time (UTC)",
  position: "insideBottom" as const,
  offset: -2,
  style: { textAnchor: "middle" as const, fontSize: 11, fill: "#9ca3af" },
};

const CHART_MARGIN = { top: 10, right: 5, left: -10, bottom: 20 }

// ── Pre-compute which ticks should display a date label ───────────────────────

function buildDateLabels(seriesData: Array<{ time: string }>): Map<string, string> {
  const map = new Map<string, string>()
  let lastSeenDate = ""
  for (const d of seriesData) {
    const dateStr = new Date(d.time).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      timeZone: "UTC",
    })
    if (dateStr !== lastSeenDate) {
      map.set(d.time, dateStr)
      lastSeenDate = dateStr
    }
  }
  return map
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenerationChart({
  data,
  compareData,
}: GenerationChartProps) {
  const isCompareMode = compareData !== undefined && compareData.length > 0;

  const [chartHeight, setChartHeight] = useState(400);
  const [yAxisWidth, setYAxisWidth] = useState(55);
  useEffect(() => {
    const update = () => {
      setChartHeight(window.innerWidth < 640 ? 280 : 400);
      setYAxisWidth(window.innerWidth < 640 ? 62 : 55);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const tickFontSize = chartHeight < 320 ? 9 : 11;

  const activeData = isCompareMode ? compareData : data;
  const tickInterval = Math.max(1, Math.floor(activeData.length / 8));

  // Pre-computed map of tick time → date label string (only for first tick of each date)
  const dateLabels = buildDateLabels(activeData);

  const yAxisProps = {
    width: yAxisWidth,
    tickFormatter: formatMW,
    tick: { fontSize: tickFontSize, fill: "#9ca3af" },
    stroke: "#6b7280",
    allowDataOverflow: false,
    label: {
      value: "Power (MW)",
      angle: -90,
      position: "insideLeft" as const,
      offset: 18,
      style: { textAnchor: "middle" as const, fontSize: 10, fill: "#9ca3af" },
    },
  } as const;

  // Inline tick renderer — identical for both chart modes, just references dateLabels
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderTick(props: any) {
    const { x, y, payload, index } = props as {
      x: number; y: number;
      payload: { value: string };
      index: number;
    }
    const timeStr = new Date(payload.value).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    })
    const currentDate = new Date(payload.value).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC",
    })
    const prevTickTime = index > 0 ? activeData[Math.max(0, 
      Math.floor((index) * tickInterval) - tickInterval)]?.time : null
    const prevDate = prevTickTime
      ? new Date(prevTickTime).toLocaleDateString("en-GB", {
          day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC",
        })
      : null
    const showDate = !prevDate || currentDate !== prevDate
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fill="#9ca3af">
          {timeStr}
        </text>
        {showDate && (
          <text x={0} y={0} dy={24} textAnchor="middle" fontSize={10} fill="#6b7280">
            {currentDate}
          </text>
        )}
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      {isCompareMode ? (
        <LineChart data={compareData} margin={CHART_MARGIN}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            dataKey="time"
            type="category"
            tickCount={8}
            interval={tickInterval}
            tick={renderTick}
            height={44}
            label={xAxisLabel}
          />
          <YAxis {...yAxisProps} />
          <Tooltip
            labelFormatter={(label: unknown) => formatTooltipLabel(String(label))}
            labelStyle={{ color: "#000000" }}
            formatter={(value: unknown, name: unknown) => [
              `${Number(value).toLocaleString()} MW`,
              name === "actual" ? "Actual" : name === "forecastA" ? "Horizon A" : "Horizon B",
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "actual" ? "Actual" : value === "forecastA" ? "Horizon A" : "Horizon B"
            }
            wrapperStyle={{ paddingBottom: 0, marginBottom: -20 }}
          />
          <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="actual" />
          <Line type="monotone" dataKey="forecastA" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="forecastA" />
          <Line type="monotone" dataKey="forecastB" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="forecastB" />
        </LineChart>
      ) : (
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.1)"
            vertical={true}
            horizontal={true}
          />
          <XAxis
            dataKey="time"
            type="category"
            tickCount={8}
            interval={tickInterval}
            tick={renderTick}
            height={44}
            label={xAxisLabel}
          />
          <YAxis {...yAxisProps} />
          <Tooltip
            labelFormatter={(label: unknown) => formatTooltipLabel(String(label))}
            labelStyle={{ color: "#000000" }}
            formatter={(value: unknown, name: unknown) => [
              `${Number(value).toLocaleString()} MW`,
              name === "actual" ? "Actual" : "Forecast",
            ]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
          <Legend
            formatter={(value: string) =>
              value === "actual" ? "Actual" : "Forecast"
            }
            wrapperStyle={{ paddingBottom: 0, marginBottom: -20 }}
          />
          <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="forecast" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
