import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { applicationsTable, resumesTable, generatedResponsesTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// GET /api/dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const [apps, resumes, genResponses] = await Promise.all([
      db.select().from(applicationsTable).where(eq(applicationsTable.userId, userId)),
      db.select().from(resumesTable).where(eq(resumesTable.userId, userId)),
      db.select().from(generatedResponsesTable),
    ]);

    const byStatus = {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    };

    for (const app of apps) {
      const s = app.status as keyof typeof byStatus;
      if (s in byStatus) byStatus[s]++;
    }

    // Count activity in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = apps.filter(a => a.createdAt >= sevenDaysAgo).length;

    // Get user's application IDs to count their generated responses
    const appIds = new Set(apps.map(a => a.id));
    const userGenResponses = genResponses.filter(g => appIds.has(g.applicationId));

    res.json({
      totalApplications: apps.length,
      byStatus,
      totalResumes: resumes.length,
      totalGeneratedResponses: userGenResponses.length,
      recentActivityCount,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/recent-applications
router.get("/dashboard/recent-applications", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.userId, userId))
      .orderBy(desc(applicationsTable.createdAt))
      .limit(5);

    res.json(apps.map(a => ({
      ...a,
      appliedAt: a.appliedAt ? a.appliedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get recent applications");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
