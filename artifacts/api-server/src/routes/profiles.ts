import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

// GET /api/profiles/me
router.get("/profiles/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    if (!profiles.length) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const p = profiles[0];
    res.json({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/profiles/me
router.put("/profiles/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const body = req.body;
  try {
    const now = new Date();
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);

    let profile;
    if (existing.length) {
      const updated = await db
        .update(profilesTable)
        .set({ ...body, userId, updatedAt: now })
        .where(eq(profilesTable.userId, userId))
        .returning();
      profile = updated[0];
    } else {
      const inserted = await db
        .insert(profilesTable)
        .values({ ...body, userId, createdAt: now, updatedAt: now })
        .returning();
      profile = inserted[0];
    }
    res.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upsert profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
