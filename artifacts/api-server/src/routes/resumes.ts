import { Router } from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/resumes", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post("/resumes", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { title, content, is_default } = req.body;
  const { data, error } = await supabase
    .from("resumes")
    .insert({ user_id: userId, title, content, is_default: is_default ?? false })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.get("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", req.params.id as string)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(data);
});

router.patch("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("resumes")
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq("id", req.params.id as string)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.delete("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", req.params.id as string)
    .eq("user_id", userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

export default router;
