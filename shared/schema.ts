import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  room: text("room").notNull(),
  age: integer("age").notNull(),
  admissionDate: timestamp("admission_date").notNull(),
  status: text("status").notNull(), // 'stable', 'warning', 'critical'
  currentRiskScore: integer("current_risk_score").notNull().default(0),
  riskTrend: text("risk_trend").notNull().default('stable'), // 'up', 'down', 'stable'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const vitals = pgTable("vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  heartRate: integer("heart_rate"),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  systolicBP: integer("systolic_bp"),
  diastolicBP: integer("diastolic_bp"),
  oxygenSaturation: integer("oxygen_saturation"),
  respiratoryRate: integer("respiratory_rate"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const labResults = pgTable("lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  lactate: decimal("lactate", { precision: 4, scale: 2 }),
  wbc: decimal("wbc", { precision: 5, scale: 2 }),
  crp: decimal("crp", { precision: 6, scale: 2 }),
  cultureStatus: text("culture_status"), // 'pending', 'negative', 'positive'
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  type: text("type").notNull(), // 'critical', 'warning', 'info'
  message: text("message").notNull(),
  source: text("source").notNull(),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const sensors = pgTable("sensors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => patients.id),
  sensorType: text("sensor_type").notNull(), // 'heart_rate', 'temperature', 'blood_pressure', 'oxygen'
  status: text("status").notNull().default('online'), // 'online', 'offline', 'error'
  lastUpdate: timestamp("last_update").notNull().default(sql`now()`),
});

export const testingSchedule = pgTable("testing_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  intervalHours: integer("interval_hours").notNull().default(2),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  vitalsCompleted: integer("vitals_completed").notNull().default(0),
  labsCompleted: integer("labs_completed").notNull().default(0),
  riskCalculated: integer("risk_calculated").notNull().default(0),
  totalPatients: integer("total_patients").notNull().default(0),
});

export const alertSettings = pgTable("alert_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  criticalThreshold: integer("critical_threshold").notNull().default(80),
  warningThreshold: integer("warning_threshold").notNull().default(60),
  monitorThreshold: integer("monitor_threshold").notNull().default(40),
  audioAlerts: boolean("audio_alerts").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(false),
  smsAlerts: boolean("sms_alerts").notNull().default(true),
});

// Insert schemas
export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertVitalsSchema = createInsertSchema(vitals).omit({
  id: true,
  timestamp: true,
});

export const insertLabResultsSchema = createInsertSchema(labResults).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
  acknowledged: true,
  acknowledgedBy: true,
  acknowledgedAt: true,
});

export const insertSensorSchema = createInsertSchema(sensors).omit({
  id: true,
  lastUpdate: true,
});

export const insertTestingScheduleSchema = createInsertSchema(testingSchedule).omit({
  id: true,
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
});

// Types
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Vitals = typeof vitals.$inferSelect;
export type InsertVitals = z.infer<typeof insertVitalsSchema>;

export type LabResults = typeof labResults.$inferSelect;
export type InsertLabResults = z.infer<typeof insertLabResultsSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Sensor = typeof sensors.$inferSelect;
export type InsertSensor = z.infer<typeof insertSensorSchema>;

export type TestingSchedule = typeof testingSchedule.$inferSelect;
export type InsertTestingSchedule = z.infer<typeof insertTestingScheduleSchema>;

export type AlertSettings = typeof alertSettings.$inferSelect;
export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;
