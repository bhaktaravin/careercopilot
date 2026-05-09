import { Router } from "express";
import type { Request, Response } from "express";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

router.get("/applications", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (req.query.status) {
    query = query.eq("status", req.query.status as string);
  }
  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.post("/applications", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...req.body, user_id: userId })
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
});

router.get("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", req.params.id as string)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) { res.status(500).json({ error: error.message }); return; }
  if (!data) { res.status(404).json({ error: "Not found" }); return; }
  res.json(data);
});

router.patch("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("applications")
    .update({ ...req.body, updated_at: new Date().toISOString() })
    .eq("id", req.params.id as string)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.delete("/applications/:id", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  // delete generated responses first
  await supabase.from("generated_responses").delete().eq("application_id", req.params.id as string);
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", req.params.id as string)
    .eq("user_id", userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(204).send();
});

router.get("/applications/:id/generated-responses", requireAuth, async (req: Request, res: Response) => {
  const { accessToken } = req as AuthRequest;
  const supabase = getSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("generated_responses")
    .select("*")
    .eq("application_id", req.params.id as string)
    .order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

export default router;
