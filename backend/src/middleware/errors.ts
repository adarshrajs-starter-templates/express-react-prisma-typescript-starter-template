import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found." });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Validation failed.", errors: error.flatten().fieldErrors });
    return;
  }
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
};