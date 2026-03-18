import type { GenerationResponse } from "@/types/generation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchGeneration(
  from: string,
  to: string,
  horizonHours: number
): Promise<GenerationResponse> {
  const url = new URL(`${API_BASE}/api/generation`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("horizonHours", String(horizonHours));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<GenerationResponse>;
}
