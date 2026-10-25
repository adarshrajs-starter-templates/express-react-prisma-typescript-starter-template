import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { enforceOrigin } from "./middleware/origin.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin.replace(/\/+$/, ""))) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
}));
app.use(enforceOrigin);
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "starter-api", timestamp: new Date().toISOString() }));
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/users", usersRouter);
app.use(notFound);
app.use(errorHandler);