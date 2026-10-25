import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env.js";

interface TokenPayload { sub: string; role: Role; }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as jwt.JwtPayload & TokenPayload;
    if (typeof payload.sub !== "string" || !Object.values(Role).includes(payload.role)) {
      res.status(401).json({ message: "Invalid authentication token." });
      return;
    }
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) { res.status(401).json({ message: "Authentication required." }); return; }
    if (!roles.includes(req.auth.role)) { res.status(403).json({ message: "You do not have permission to perform this action." }); return; }
    next();
  };
}