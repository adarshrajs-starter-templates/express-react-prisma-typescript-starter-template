import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";

export const usersRouter = Router();
usersRouter.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

usersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 200,
    });
    res.json({ data: users });
  } catch (error) { next(error); }
});

usersRouter.patch("/:id/role", authorize(Role.SUPER_ADMIN), async (req, res, next) => {
  try {
    const { role } = z.object({ role: z.nativeEnum(Role) }).parse(req.body);
    if (req.params.id === req.auth!.userId && role !== Role.SUPER_ADMIN) {
      res.status(400).json({ message: "You cannot remove your own super-admin role." }); return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id }, data: { role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ user });
  } catch (error) { next(error); }
});

usersRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    if (req.params.id === req.auth!.userId && !isActive) {
      res.status(400).json({ message: "You cannot deactivate your own account." }); return;
    }
    const user = await prisma.user.update({
      where: { id: req.params.id }, data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ user });
  } catch (error) { next(error); }
});