import { Router } from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/profiles/me", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(data);
});

router.put("/profiles/me", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const body = { ...req.body, user_id: userId, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("profiles")
    .upsert(body, { onConflict: "user_id" })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
