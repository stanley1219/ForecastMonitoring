import type { FastifyInstance } from "fastify";
import type { ActualDataPoint, ForecastDataPoint } from "../types/elexon.js";
import { fetchActuals, fetchForecasts } from "../services/elexonService.js";
import { applyHorizonFilter } from "../utils/filterForecasts.js";

type ActualsQuery = {
  from?: string;
  to?: string;
};

type ForecastsQuery = {
  from?: string;
  to?: string;
};

type GenerationQuery = {
  from?: string;
  to?: string;
  horizonHours?: string;
};

export default async function generationRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ActualsQuery }>(
    "/api/actuals",
    async (request, reply): Promise<{ data: ActualDataPoint[] } | void> => {
      const { from, to } = request.query;

      if (!from || !to) {
        reply.code(400);
        return reply.send({ error: "`from` and `to` are required" });
      }

      const data = await fetchActuals(from, to);
      return { data };
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

      const data = await fetchForecasts(from, to);
      return { data };
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
      const parsedHorizon = horizonHours ? Number(horizonHours) : 4;
      const forecastFrom = `${from}T00:00:00Z`;
      const forecastTo = `${to}T23:59:59Z`;
      const [actuals, forecasts] = await Promise.all([
        fetchActuals(from, to),
        fetchForecasts(forecastFrom, forecastTo)
      ]);
      const data = applyHorizonFilter(actuals, forecasts, parsedHorizon);
      return { data, from, to, horizonHours: parsedHorizon };
    }
  );
}

