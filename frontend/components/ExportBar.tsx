"use client";

import { useState } from "react";
import type { GenerationDataPoint, CompareDataPoint } from "@/types/generation";

interface ExportBarProps {
  data: GenerationDataPoint[];
  compareData: CompareDataPoint[];
  from: string;
  to: string;
  compareMode: boolean;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(
  data: GenerationDataPoint[],
  compareData: CompareDataPoint[],
  compareMode: boolean,
  from: string,
  to: string
) {
  let csv: string;

  if (compareMode && compareData.length > 0) {
    const header = "time,actual,forecastA,forecastB";
    const rows = compareData.map(
      (p) => `${p.time},${p.actual},${p.forecastA},${p.forecastB}`
    );
    csv = [header, ...rows].join("\n");
  } else {
    const header = "time,actual,forecast";
    const rows = data.map((p) => `${p.time},${p.actual},${p.forecast}`);
    csv = [header, ...rows].join("\n");
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `forecast-monitor-${from}-${to}.csv`);
}

async function exportPNG(from: string, to: string): Promise<void> {
  const element = document.getElementById("generation-chart-container");
  if (!element) return;

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, { backgroundColor: "#09090b" });

  const link = document.createElement("a");
  link.download = `forecast-monitor-${from}-${to}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

const btnClass =
  "rounded-lg border border-zinc-300 bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed";

export default function ExportBar({
  data,
  compareData,
  from,
  to,
  compareMode,
}: ExportBarProps) {
  const [pngExporting, setPngExporting] = useState(false);

  const hasData = data.length > 0 || compareData.length > 0;
  if (!hasData) return null;

  async function handlePNG() {
    setPngExporting(true);
    try {
      await exportPNG(from, to);
    } finally {
      setPngExporting(false);
    }
  }

  return (
    <div className="mt-3 flex justify-center gap-3">
      <button
        className={btnClass}
        onClick={() => exportCSV(data, compareData, compareMode, from, to)}
      >
        ↓ CSV
      </button>
      <button className={btnClass} disabled={pngExporting} onClick={() => void handlePNG()}>
        {pngExporting ? "Exporting..." : "↓ PNG"}
      </button>
    </div>
  );
}
