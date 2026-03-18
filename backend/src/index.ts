import Fastify from "fastify";
import cors from "@fastify/cors";
import generationRoutes from "./routes/generation.js";

const app = Fastify({ logger: true });

async function main() {
  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => {
    return { status: "ok" } as const;
  });

  await app.register(generationRoutes);

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "0.0.0.0";

  await app.listen({ port, host });
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
