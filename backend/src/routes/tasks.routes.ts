import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

export const tasksRouter = Router();
tasksRouter.use(authenticate);

const taskInput = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  completed: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "At least one field is required." });

function canReadAll(role: Role) { return role === Role.ADMIN || role === Role.SUPER_ADMIN; }

tasksRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "10"), 10) || 10));
    const where = canReadAll(req.auth!.role) ? {} : { userId: req.auth!.userId };
    const [data, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.task.count({ where }),
    ]);
    res.json({ data, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const input = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).optional() }).parse(req.body);
    const task = await prisma.task.create({ data: { ...input, userId: req.auth!.userId } });
    res.status(201).json({ task });
  } catch (error) { next(error); }
});

tasksRouter.get("/:id", async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || (!canReadAll(req.auth!.role) && task.userId !== req.auth!.userId)) { res.status(404).json({ message: "Task not found." }); return; }
    res.json({ task });
  } catch (error) { next(error); }
});

tasksRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = taskInput.parse(req.body);
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing || (!canReadAll(req.auth!.role) && existing.userId !== req.auth!.userId)) { res.status(404).json({ message: "Task not found." }); return; }
    const task = await prisma.task.update({ where: { id: existing.id }, data: input });
    res.json({ task });
  } catch (error) { next(error); }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing || (!canReadAll(req.auth!.role) && existing.userId !== req.auth!.userId)) { res.status(404).json({ message: "Task not found." }); return; }
    await prisma.task.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) { next(error); }
});