import type { FastifyInstance } from "fastify";
import type { ActualDataPoint, ForecastDataPoint } from "../types/elexon.js";
import { fetchActuals, fetchForecasts } from "../services/elexonService.js";
import { applyHorizonFilter } from "../utils/filterForecasts.js";
import { isToday } from "../utils/cache.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DATE = "2025-01-01";

function todayUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

interface DateRangeError {
  status: 400;
  message: string;
}

function validateDateRange(from: string, to: string): DateRangeError | null {
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return { status: 400, message: "from and to must be in YYYY-MM-DD format" };
  }
  if (from < MIN_DATE || to < MIN_DATE) {
    return { status: 400, message: "data available from 2025-01-01 only" };
  }
  const today = todayUTC();
  if (from > today || to > today) {
    return { status: 400, message: "to date cannot be in the future" };
  }
  if (from > to) {
    return { status: 400, message: "from must not be after to" };
  }
  return null;
}

function errorResponse(err: unknown): { status: 500 | 502 | 504; body: { error: string; code: string } } {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("timed out")) {
    return {
      status: 504,
      body: { error: "Data provider timed out. Please try again.", code: "TIMEOUT" },
    };
  }
  if (msg.includes("fetch")) {
    return {
      status: 502,
      body: { error: "Unable to reach data provider. Please try again.", code: "UPSTREAM_ERROR" },
    };
  }
  return {
    status: 500,
    body: { error: "An unexpected error occurred.", code: "INTERNAL_ERROR" },
  };
}

function setCacheControl(reply: { header(name: string, value: string): void }, toDate: string): void {
  if (isToday(toDate)) {
    reply.header("Cache-Control", "public, max-age=300");
  } else {
    reply.header("Cache-Control", "public, max-age=3600, immutable");
  }
}

// ── routes ───────────────────────────────────────────────────────────────────

type ActualsQuery = { from?: string; to?: string };
type ForecastsQuery = { from?: string; to?: string };
type GenerationQuery = { from?: string; to?: string; horizonHours?: string };

export default async function generationRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ActualsQuery }>(
    "/api/actuals",
    async (request, reply): Promise<{ data: ActualDataPoint[] } | void> => {
      const { from, to } = request.query;

      if (!from || !to) {
        reply.code(400);
        return reply.send({ error: "`from` and `to` are required" });
      }

      const rangeErr = validateDateRange(from, to);
      if (rangeErr) {
        reply.code(rangeErr.status);
        return reply.send({ error: rangeErr.message });
      }

      try {
        const data = await fetchActuals(from, to);
        setCacheControl(reply, to);
        return { data };
      } catch (err) {
        const { status, body } = errorResponse(err);
        reply.code(status);
        return reply.send(body);
      }
    }
  );

  fastify.get<{ Querystring: ForecastsQuery }>(
    "/api/forecasts",
    async (request, reply): Promise<{ data: ForecastDataPoint[] } | void> => {
      const { from, to } = request.query;

      if (!from || !to) {
        reply.code(400);
        return reply.send({ error: "`from` and `to` are required" });
      }

      const rangeErr = validateDateRange(from, to);
      if (rangeErr) {
        reply.code(rangeErr.status);
        return reply.send({ error: rangeErr.message });
      }

      try {
        const data = await fetchForecasts(from, to);
        setCacheControl(reply, to);
        return { data };
      } catch (err) {
        const { status, body } = errorResponse(err);
        reply.code(status);
        return reply.send(body);
      }
    }
  );

  fastify.get<{ Querystring: GenerationQuery }>(
    "/api/generation",
    async (request, reply) => {
      const { from, to, horizonHours } = request.query;

      if (!from || !to) {
        reply.code(400);
        return reply.send({ error: "`from` and `to` are required" });
      }

      const rangeErr = validateDateRange(from, to);
      if (rangeErr) {
        reply.code(rangeErr.status);
        return reply.send({ error: rangeErr.message });
      }

      const parsedHorizon = horizonHours !== undefined ? Number(horizonHours) : 4;
      if (
        !Number.isFinite(parsedHorizon) ||
        !Number.isInteger(parsedHorizon) ||
        parsedHorizon < 1 ||
        parsedHorizon > 48
      ) {
        reply.code(400);
        return reply.send({ error: "horizonHours must be between 1 and 48" });
      }

      try {
        const forecastFromDate = new Date(from);
        forecastFromDate.setHours(forecastFromDate.getHours() - parsedHorizon);
        const forecastFrom = forecastFromDate.toISOString();
        const forecastTo = `${to}T23:59:59Z`;

        const [actuals, forecasts] = await Promise.all([
          fetchActuals(from, to),
          fetchForecasts(forecastFrom, forecastTo),
        ]);

        const data = applyHorizonFilter(actuals, forecasts, parsedHorizon);
        setCacheControl(reply, to);
        return { data, from, to, horizonHours: parsedHorizon };
      } catch (err) {
        const { status, body } = errorResponse(err);
        reply.code(status);
        return reply.send(body);
      }
    }
  );
}
