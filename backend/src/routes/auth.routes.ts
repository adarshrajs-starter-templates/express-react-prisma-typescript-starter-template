import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";

export const authRouter = Router();
const publicUser = (user: { id: string; name: string; email: string; role: Role; isActive: boolean }) => user;
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) { res.status(409).json({ message: "An account with this email already exists." }); return; }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const profile = { name: input.name, email: input.email };
    const user = await prisma.user.create({ data: { ...profile, passwordHash, role: Role.USER }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    res.status(201).json({ user: publicUser(user), token });
  } catch (error) { next(error); }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().trim().email().transform((value) => value.toLowerCase()), password: z.string().min(1).max(128) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password." }); return;
    }
    const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
    res.json({ user: publicUser(user), token });
  } catch (error) { next(error); }
});

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    if (!user || !user.isActive) { res.status(401).json({ message: "Account is unavailable." }); return; }
    res.json({ user });
  } catch (error) { next(error); }
});