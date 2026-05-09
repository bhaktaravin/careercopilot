import { Router } from "express";
import type { Request, Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db } from "@workspace/db";
import { generatedResponsesTable, applicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

type GeneratedResponseType =
  | "resume_summary"
  | "bullet_points"
  | "cover_letter"
  | "why_role"
  | "tell_me_about_yourself"
  | "why_hire_you"
  | "describe_experience"
  | "strengths";

function buildPromptForType(
  type: GeneratedResponseType,
  resumeContent: string,
  jobDescription: string,
  companyName?: string,
  jobTitle?: string
): string {
  const context = `
Resume:
${resumeContent}

Job Description:
${jobDescription}

Company: ${companyName ?? "the company"}
Role: ${jobTitle ?? "the role"}
`.trim();

  const prompts: Record<GeneratedResponseType, string> = {
    resume_summary: `Based on the resume and job description below, write a concise, ATS-optimized professional summary (3-4 sentences) that highlights the most relevant experience and skills. Be specific, truthful, and tailor it to the role. Use keywords from the job description naturally.\n\n${context}`,
    bullet_points: `Rewrite the key bullet points from this resume to better match the job description. Focus on impact, quantifiable achievements, and relevant skills. Make them ATS-friendly. Return 5-8 rewritten bullet points only, each on a new line starting with "•".\n\n${context}`,
    cover_letter: `Write a professional, compelling cover letter for this job application. It should be 3-4 paragraphs: opening hook, relevant experience, why this company, and a strong closing. Be authentic, specific, and tailored — not generic.\n\n${context}`,
    why_role: `Write a compelling 2-3 paragraph answer to "Why do you want this role?" Based on the resume and job description, make it genuine, specific, and focused on how this role aligns with career goals and skills.\n\n${context}`,
    tell_me_about_yourself: `Write a strong 2-3 paragraph "Tell me about yourself" response tailored to this role. Structure it as: past experience, current situation/skills, and why this opportunity. Keep it concise and relevant to the job.\n\n${context}`,
    why_hire_you: `Write a confident, evidence-backed 2-3 paragraph response to "Why should we hire you?" Highlight the top 3 differentiators based on the resume and what the job requires. Be specific, not generic.\n\n${context}`,
    describe_experience: `Write a clear, structured 2-3 paragraph response describing relevant experience for this role. Draw directly from the resume and map it to what the job description requires.\n\n${context}`,
    strengths: `Write a thoughtful 2-3 paragraph response to "What are your strengths?" Based on the resume and job description, highlight 3 key strengths with specific examples from work experience that are most relevant to this role.\n\n${context}`,
  };

  return prompts[type];
}

// POST /api/ai/generate
router.post("/ai/generate", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as Request & { userId: string }).userId;
  const { applicationId, resumeContent, jobDescription, types } = req.body as {
    applicationId: number;
    resumeContent: string;
    jobDescription: string;
    types: GeneratedResponseType[];
  };

  if (!resumeContent || !jobDescription || !types?.length) {
    res.status(400).json({ error: "resumeContent, jobDescription, and types are required" });
    return;
  }

  try {
    // Get application details for context
    let companyName: string | undefined;
    let jobTitle: string | undefined;
    if (applicationId) {
      const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.id, applicationId)).limit(1);
      if (apps.length) {
        companyName = apps[0].companyName;
        jobTitle = apps[0].jobTitle;
      }
    }

    // Generate all requested types
    const results = [];
    for (const type of types) {
      const prompt = buildPromptForType(type, resumeContent, jobDescription, companyName, jobTitle);
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 8192,
        messages: [
          {
            role: "system",
            content: "You are an expert career coach and resume writer. You help job seekers craft compelling, ATS-optimized application materials. Always be truthful — never fabricate experience or skills. Be concise, specific, and professional.",
          },
          { role: "user", content: prompt },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? "";

      // Save to DB
      const saved = await db.insert(generatedResponsesTable).values({
        applicationId,
        type,
        content,
        createdAt: new Date(),
      }).returning();

      results.push({
        ...saved[0],
        createdAt: saved[0].createdAt.toISOString(),
      });
    }

    // Update application match score if we generated content
    if (applicationId && types.includes("resume_summary")) {
      const atsPrompt = `Rate how well this resume matches this job description on a scale of 0-100. Return ONLY a number, nothing else.\n\nResume:\n${resumeContent}\n\nJob Description:\n${jobDescription}`;
      const scoreCompletion = await openai.chat.completions.create({
        model: "gpt-5-nano",
        max_completion_tokens: 10,
        messages: [{ role: "user", content: atsPrompt }],
      });
      const scoreText = scoreCompletion.choices[0]?.message?.content ?? "0";
      const score = parseInt(scoreText.replace(/[^0-9]/g, "")) || 0;
      if (score > 0) {
        await db.update(applicationsTable).set({ matchScore: Math.min(100, score) }).where(and(eq(applicationsTable.id, applicationId), eq(applicationsTable.userId, userId)));
      }
    }

    res.json({ results });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI content");
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// POST /api/ai/analyze-ats
router.post("/ai/analyze-ats", requireAuth, async (req: Request, res: Response) => {
  const { resumeContent, jobDescription } = req.body;
  if (!resumeContent || !jobDescription) {
    res.status(400).json({ error: "resumeContent and jobDescription required" });
    return;
  }

  try {
    const prompt = `Analyze the ATS keyword match between this resume and job description. Return a JSON object with:
- matchScore: number 0-100
- matchedKeywords: string[] (keywords from the job description present in the resume)
- missingKeywords: string[] (important keywords from the job description missing from the resume)
- suggestions: string[] (3-5 specific actionable suggestions to improve the resume for this job)

Return ONLY valid JSON, no markdown or explanation.

Resume:
${resumeContent}

Job Description:
${jobDescription}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: "You are an ATS expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      parsed = { matchScore: 0, matchedKeywords: [], missingKeywords: [], suggestions: [] };
    }

    res.json({
      matchScore: parsed.matchScore ?? 0,
      matchedKeywords: parsed.matchedKeywords ?? [],
      missingKeywords: parsed.missingKeywords ?? [],
      suggestions: parsed.suggestions ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to analyze ATS");
    res.status(500).json({ error: "Failed to analyze ATS" });
  }
});

// POST /api/ai/answer-question
router.post("/ai/answer-question", requireAuth, async (req: Request, res: Response) => {
  const { question, resumeContent, jobDescription } = req.body;
  if (!question || !resumeContent || !jobDescription) {
    res.status(400).json({ error: "question, resumeContent, and jobDescription required" });
    return;
  }

  try {
    const prompt = `You are helping a job candidate answer this application question: "${question}"

Based on their resume and the job description below, write a compelling, concise, and truthful answer (2-3 paragraphs). Be specific and tailor the answer to the role.

Resume:
${resumeContent}

Job Description:
${jobDescription}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: "You are an expert career coach. Write authentic, tailored application answers." },
        { role: "user", content: prompt },
      ],
    });

    res.json({ answer: completion.choices[0]?.message?.content ?? "" });
  } catch (err) {
    req.log.error({ err }, "Failed to answer question");
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

export default router;
