import { Router } from "express";
import type { Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getSupabaseClient } from "../lib/supabase";
import { requireAuth, type AuthRequest } from "./auth";

const router = Router();

type GeneratedResponseType =
  | "resume_summary" | "bullet_points" | "cover_letter"
  | "why_role" | "tell_me_about_yourself" | "why_hire_you"
  | "describe_experience" | "strengths";

function buildPrompt(type: GeneratedResponseType, resumeContent: string, jobDescription: string, companyName?: string, jobTitle?: string): string {
  const ctx = `Resume:\n${resumeContent}\n\nJob Description:\n${jobDescription}\n\nCompany: ${companyName ?? "the company"}\nRole: ${jobTitle ?? "the role"}`;
  const prompts: Record<GeneratedResponseType, string> = {
    resume_summary: `Based on the resume and job description below, write a concise, ATS-optimized professional summary (3-4 sentences) that highlights the most relevant experience and skills.\n\n${ctx}`,
    bullet_points: `Rewrite the key bullet points from this resume to better match the job description. Return 5-8 rewritten bullet points, each starting with "•".\n\n${ctx}`,
    cover_letter: `Write a professional, compelling cover letter for this job application (3-4 paragraphs). Be authentic, specific, and tailored.\n\n${ctx}`,
    why_role: `Write a compelling 2-3 paragraph answer to "Why do you want this role?"\n\n${ctx}`,
    tell_me_about_yourself: `Write a strong 2-3 paragraph "Tell me about yourself" response tailored to this role.\n\n${ctx}`,
    why_hire_you: `Write a confident, evidence-backed 2-3 paragraph response to "Why should we hire you?"\n\n${ctx}`,
    describe_experience: `Write a clear 2-3 paragraph response describing relevant experience for this role.\n\n${ctx}`,
    strengths: `Write a thoughtful 2-3 paragraph response to "What are your strengths?" with specific examples relevant to this role.\n\n${ctx}`,
  };
  return prompts[type];
}

router.post("/ai/generate", requireAuth, async (req: Request, res: Response) => {
  const { userId, accessToken } = req as AuthRequest;
  const { application_id, resume_content, job_description, types } = req.body as {
    application_id?: string;
    resume_content: string;
    job_description: string;
    types: GeneratedResponseType[];
  };
  if (!resume_content || !job_description || !types?.length) {
    res.status(400).json({ error: "resume_content, job_description, and types are required" });
    return;
  }
  try {
    const supabase = getSupabaseClient(accessToken);
    let companyName: string | undefined;
    let jobTitle: string | undefined;
    if (application_id) {
      const { data } = await supabase.from("applications").select("company_name, job_title").eq("id", application_id).maybeSingle();
      companyName = data?.company_name;
      jobTitle = data?.job_title;
    }
    const results = [];
    for (const type of types) {
      const prompt = buildPrompt(type, resume_content, job_description, companyName, jobTitle);
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: "You are an expert career coach and resume writer. Be truthful, specific, and professional." },
          { role: "user", content: prompt },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? "";
      const { data: saved } = await supabase
        .from("generated_responses")
        .insert({ application_id, type, content })
        .select()
        .single();
      results.push(saved);
    }
    // Update match score
    if (application_id && types.includes("resume_summary")) {
      const scoreCompletion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        max_completion_tokens: 10,
        messages: [{ role: "user", content: `Rate how well this resume matches this job description on a scale of 0-100. Return ONLY a number.\n\nResume:\n${resume_content}\n\nJob Description:\n${job_description}` }],
      });
      const score = parseInt((scoreCompletion.choices[0]?.message?.content ?? "0").replace(/[^0-9]/g, "")) || 0;
      if (score > 0) {
        await supabase.from("applications").update({ match_score: Math.min(100, score) }).eq("id", application_id).eq("user_id", userId);
      }
    }
    res.json({ results });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI content");
    res.status(500).json({ error: "Failed to generate content" });
  }
});

router.post("/ai/analyze-ats", requireAuth, async (req: Request, res: Response) => {
  const { resume_content, job_description } = req.body;
  if (!resume_content || !job_description) { res.status(400).json({ error: "resume_content and job_description required" }); return; }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: "You are an ATS expert. Return only valid JSON." },
        { role: "user", content: `Analyze the ATS keyword match. Return JSON with: matchScore (0-100), matchedKeywords (string[]), missingKeywords (string[]), suggestions (string[], 3-5 items). Return ONLY valid JSON.\n\nResume:\n${resume_content}\n\nJob Description:\n${job_description}` },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim()); } catch { parsed = {}; }
    res.json({ match_score: parsed.matchScore ?? 0, matched_keywords: parsed.matchedKeywords ?? [], missing_keywords: parsed.missingKeywords ?? [], suggestions: parsed.suggestions ?? [] });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze ATS");
    res.status(500).json({ error: "Failed to analyze ATS" });
  }
});

router.post("/ai/answer-question", requireAuth, async (req: Request, res: Response) => {
  const { question, resume_content, job_description } = req.body;
  if (!question || !resume_content || !job_description) { res.status(400).json({ error: "question, resume_content, and job_description required" }); return; }
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: "You are an expert career coach. Write authentic, tailored application answers." },
        { role: "user", content: `Answer this application question: "${question}"\n\nResume:\n${resume_content}\n\nJob Description:\n${job_description}` },
      ],
    });
    res.json({ answer: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to answer question");
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

export default router;
