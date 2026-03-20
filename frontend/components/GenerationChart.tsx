"use client";

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

function formatTick(iso: string, multiDay: boolean): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  if (!multiDay) return `${hh}:${mm}`;
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${mo}/${day} ${hh}:${mm}`;
}

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

const axisProps = {
  width: 45 as const,
  tickFormatter: formatMW,
  tick: { fontSize: 11 },
  stroke: "#6b7280",
  label: {
    value: "MW",
    angle: -90,
    position: "insideLeft" as const,
    offset: 10,
    style: { fontSize: 11, fill: "#6b7280" },
  },
};

export default function GenerationChart({
  data,
  multiDay,
  compareData,
}: GenerationChartProps) {
  const isCompareMode = compareData !== undefined && compareData.length > 0;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: "550px" }}>
        <ResponsiveContainer width="100%" height={400}>
          {isCompareMode ? (
            <LineChart
              data={compareData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tickFormatter={(iso: string) => formatTick(iso, multiDay)}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis {...axisProps} />
              <Tooltip
                labelFormatter={(label: unknown) =>
                  formatTooltipLabel(String(label))
                }
                labelStyle={{ color: "#000000" }}
                formatter={(value: unknown, name: unknown) => [
                  `${Number(value).toLocaleString()} MW`,
                  name === "actual"
                    ? "Actual"
                    : name === "forecastA"
                    ? "Horizon A"
                    : "Horizon B",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === "actual"
                    ? "Actual"
                    : value === "forecastA"
                    ? "Horizon A"
                    : "Horizon B"
                }
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="actual"
              />
              <Line
                type="monotone"
                dataKey="forecastA"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="forecastA"
              />
              <Line
                type="monotone"
                dataKey="forecastB"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="forecastB"
              />
            </LineChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tickFormatter={(iso: string) => formatTick(iso, multiDay)}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis {...axisProps} />
              <Tooltip
                labelFormatter={(label: unknown) =>
                  formatTooltipLabel(String(label))
                }
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
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
