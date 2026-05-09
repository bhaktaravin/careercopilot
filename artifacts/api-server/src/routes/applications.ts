import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { applicationsTable, generatedResponsesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

const serializeApp = (a: typeof applicationsTable.$inferSelect) => ({
  ...a,
  appliedAt: a.appliedAt ? a.appliedAt.toISOString() : null,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

const serializeGenResponse = (g: typeof generatedResponsesTable.$inferSelect) => ({
  ...g,
  createdAt: g.createdAt.toISOString(),
});

// GET /api/applications
router.get("/applications", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const status = req.query.status as string | undefined;
  try {
    let query = db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId)).$dynamic();
    if (status) {
      query = query.where(and(eq(applicationsTable.userId, userId), eq(applicationsTable.status, status)));
    }
    const apps = await query.orderBy(desc(applicationsTable.createdAt));
    res.json(apps.map(serializeApp));
  } catch (err) {
    req.log.error({ err }, "Failed to list applications");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/applications
router.post("/applications", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const body = req.body;
  try {
    const now = new Date();
    const inserted = await db.insert(applicationsTable).values({
      userId,
      companyName: body.companyName,
      jobTitle: body.jobTitle,
      jobUrl: body.jobUrl ?? null,
      jobDescription: body.jobDescription ?? null,
      status: body.status ?? "saved",
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : null,
      notes: body.notes ?? null,
      resumeId: body.resumeId ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning();
    res.status(201).json(serializeApp(inserted[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to create application");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:id
router.get("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  try {
    const apps = await db.select().from(applicationsTable).where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId))).limit(1);
    if (!apps.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeApp(apps[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get application");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/applications/:id
router.patch("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  const body = req.body;
  try {
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.appliedAt) updateData.appliedAt = new Date(body.appliedAt);
    const updated = await db.update(applicationsTable).set(updateData).where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId))).returning();
    if (!updated.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeApp(updated[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to update application");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/applications/:id
router.delete("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const id = parseInt(req.params.id as string);
  try {
    await db.delete(generatedResponsesTable).where(eq(generatedResponsesTable.applicationId, id));
    await db.delete(applicationsTable).where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete application");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:id/generated-responses
router.get("/applications/:id/generated-responses", requireAuth, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  try {
    const responses = await db.select().from(generatedResponsesTable).where(eq(generatedResponsesTable.applicationId, id)).orderBy(desc(generatedResponsesTable.createdAt));
    res.json(responses.map(serializeGenResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to get generated responses");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
