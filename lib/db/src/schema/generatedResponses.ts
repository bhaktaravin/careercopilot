import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const generatedResponseTypeEnum = [
  "resume_summary",
  "bullet_points",
  "cover_letter",
  "why_role",
  "tell_me_about_yourself",
  "why_hire_you",
  "describe_experience",
  "strengths",
] as const;
export type GeneratedResponseType = typeof generatedResponseTypeEnum[number];

export const generatedResponsesTable = pgTable("generated_responses", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedResponseSchema = createInsertSchema(generatedResponsesTable).omit({ id: true, createdAt: true });
export type InsertGeneratedResponse = z.infer<typeof insertGeneratedResponseSchema>;
export type GeneratedResponse = typeof generatedResponsesTable.$inferSelect;
