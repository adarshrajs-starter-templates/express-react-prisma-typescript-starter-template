import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`REST API listening on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));