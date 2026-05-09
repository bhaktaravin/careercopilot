import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"] as const;
export type ApplicationStatus = typeof applicationStatusEnum[number];

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  jobUrl: text("job_url"),
  jobDescription: text("job_description"),
  status: text("status").notNull().default("saved"),
  appliedAt: timestamp("applied_at"),
  notes: text("notes"),
  resumeId: integer("resume_id"),
  matchScore: integer("match_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
