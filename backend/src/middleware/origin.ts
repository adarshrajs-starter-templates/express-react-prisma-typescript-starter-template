import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Browser-origin allowlist. This is not a substitute for authentication or a network firewall:
 * non-browser clients can omit/spoof Origin headers. CORS controls browser JavaScript access.
 */
export function enforceOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  if (!origin) { next(); return; } // CLI, health checks, and server-to-server clients may omit Origin.
  const normalized = origin.replace(/\/+$/, "");
  if (!env.corsOrigins.includes(normalized)) {
    res.status(403).json({ message: "Origin is not allowed." });
    return;
  }
  next();
}