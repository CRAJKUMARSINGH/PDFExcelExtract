import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PDF Processing job schema
export const processingJobs = pgTable("processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  progress: integer("progress").default(0), // 0-100
});

// Extracted table schema
export const extractedTables = pgTable("extracted_tables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => processingJobs.id),
  tableIndex: integer("table_index").notNull(),
  data: json("data").notNull(), // JSON array of table rows
  headers: json("headers"), // JSON array of column headers
  confidence: integer("confidence"), // OCR confidence score 0-100
  boundingBox: json("bounding_box"), // Table position in PDF
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
});

// Insert schemas
export const insertProcessingJobSchema = createInsertSchema(processingJobs).pick({
  filename: true,
  status: true,
});

export const insertExtractedTableSchema = createInsertSchema(extractedTables).pick({
  jobId: true,
  tableIndex: true,
  data: true,
  headers: true,
  confidence: true,
  boundingBox: true,
});

// Types
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertExtractedTable = z.infer<typeof insertExtractedTableSchema>;
export type ExtractedTable = typeof extractedTables.$inferSelect;

// Frontend-specific types for the processing workflow
export type ProcessingStep = "upload" | "ocr" | "table-detection" | "excel-generation" | "complete";

export type ProcessingStatus = {
  step: ProcessingStep;
  progress: number;
  message: string;
};

export type TablePreview = {
  id: string;
  headers: string[];
  data: string[][];
  confidence: number;
  rowCount: number;
  colCount: number;
};
