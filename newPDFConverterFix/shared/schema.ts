import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  progress: integer("progress").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  options: jsonb("options").default({}),
});

export const extractedTables = pgTable("extracted_tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => processingJobs.id, { onDelete: "cascade" }),
  tableIndex: integer("table_index").notNull(),
  headers: jsonb("headers").$type<string[]>(),
  data: jsonb("data").$type<string[][]>().notNull(),
  confidence: integer("confidence"),
  boundingBox: jsonb("bounding_box").$type<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>(),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  uploadedAt: true,
  completedAt: true,
  progress: true,
});

export const insertExtractedTableSchema = createInsertSchema(extractedTables).omit({
  id: true,
  extractedAt: true,
});

export const updateJobStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  errorMessage: z.string().optional(),
});

export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertExtractedTable = z.infer<typeof insertExtractedTableSchema>;
export type ExtractedTable = typeof extractedTables.$inferSelect;
export type UpdateJobStatus = z.infer<typeof updateJobStatusSchema>;

// File types for storage
export interface FileUpload {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface ProcessedFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface JobWithTables {
  job: ProcessingJob;
  tables: ExtractedTable[];
}

export interface ListJobsParams {
  page: number;
  pageSize: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ListJobsResult {
  jobs: ProcessingJob[];
  total: number;
}
