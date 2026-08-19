import { pgTable, serial, varchar, integer, timestamp, text, jsonb, boolean, real } from "drizzle-orm/pg-core"

export const visionDevices = pgTable("vision_devices", {
  id: serial("id").primaryKey(),
  deviceId: varchar("device_id", { length: 64 }).notNull().unique(),
  localId: varchar("local_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  deviceType: varchar("device_type", { length: 32 }).notNull().default("camera"),
  taskType: varchar("task_type", { length: 32 }).notNull().default("fissure"),
  connectionType: varchar("connection_type", { length: 32 }).notNull().default("rtsp"),
  connectionConfig: jsonb("connection_config").notNull().default({}),
  captureIntervalMs: integer("capture_interval_ms").notNull().default(60000),
  isActive: boolean("is_active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type VisionDevice = typeof visionDevices.$inferSelect
export type NewVisionDevice = typeof visionDevices.$inferInsert

export const visionObservations = pgTable("vision_observations", {
  id: serial("id").primaryKey(),
  observationId: varchar("observation_id", { length: 128 }).notNull().unique(),
  deviceId: varchar("device_id", { length: 64 }).notNull(),
  localId: varchar("local_id", { length: 64 }).notNull(),
  taskType: varchar("task_type", { length: 32 }).notNull().default("fissure"),
  capturedAt: timestamp("captured_at").notNull(),
  filePath: text("file_path"),
  sha256: varchar("sha256", { length: 64 }),
  width: integer("width"),
  height: integer("height"),
  qualityScore: real("quality_score"),
  qualityIssues: text("quality_issues"),
  algorithmVersion: varchar("algorithm_version", { length: 32 }),
  status: varchar("status", { length: 32 }).notNull().default("received"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
})

export type VisionObservation = typeof visionObservations.$inferSelect
export type NewVisionObservation = typeof visionObservations.$inferInsert
