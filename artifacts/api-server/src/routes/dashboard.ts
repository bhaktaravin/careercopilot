import { Router } from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const [appsRes, resumesRes] = await Promise.all([
    supabase.from("applications").select("id, status, created_at").eq("user_id", userId),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if (appsRes.error) { res.status(500).json({ error: appsRes.error.message }); return; }
  const apps = appsRes.data ?? [];
  const byStatus: Record<string, number> = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 };
  for (const a of apps) {
    if (a.status in byStatus) byStatus[a.status]++;
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentActivityCount = apps.filter(a => a.created_at >= sevenDaysAgo).length;

  // count generated responses for this user's applications
  const appIds = apps.map(a => a.id);
  let totalGeneratedResponses = 0;
  if (appIds.length > 0) {
    const { count } = await supabase
      .from("generated_responses")
      .select("id", { count: "exact", head: true })
      .in("application_id", appIds);
    totalGeneratedResponses = count ?? 0;
  }

  res.json({
    totalApplications: apps.length,
    byStatus,
    totalResumes: resumesRes.count ?? 0,
    totalGeneratedResponses,
    recentActivityCount,
  });
});

router.get("/dashboard/recent-applications", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
