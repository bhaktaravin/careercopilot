import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "../lib/supabase";

export interface AuthRequest extends Request {
  userId: string;
  accessToken: string;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const accessToken = authHeader.slice(7);
  try {
    const supabase = getSupabaseClient(accessToken);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as AuthRequest).userId = user.id;
    (req as AuthRequest).accessToken = accessToken;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
