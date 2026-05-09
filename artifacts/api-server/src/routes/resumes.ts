import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { resumesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

const serializeResume = (r: typeof resumesTable.$inferSelect) => ({
  ...r,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

// GET /api/resumes
router.get("/resumes", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const resumes = await db.select().from(resumesTable).where(eq(resumesTable.userId, userId));
    res.json(resumes.map(serializeResume));
  } catch (err) {
    req.log.error({ err }, "Failed to list resumes");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/resumes
router.post("/resumes", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const { title, content, isDefault } = req.body;
  try {
    const now = new Date();
    const inserted = await db.insert(resumesTable).values({ userId, title, content, isDefault: isDefault ?? false, createdAt: now, updatedAt: now }).returning();
    res.status(201).json(serializeResume(inserted[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to create resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/resumes/:id
router.get("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  try {
    const resumes = await db.select().from(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, userId))).limit(1);
    if (!resumes.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeResume(resumes[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/resumes/:id
router.patch("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  try {
    const updated = await db.update(resumesTable).set({ ...req.body, updatedAt: new Date() }).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, userId))).returning();
    if (!updated.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeResume(updated[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to update resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/resumes/:id
router.delete("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  try {
    await db.delete(resumesTable).where(and(eq(resumesTable.id, id), eq(resumesTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete resume");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
