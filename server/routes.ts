import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVitalsSchema, insertLabResultsSchema, insertAlertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Patients
  app.get("/api/patients", async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", async (req, res) => {
    const patient = await storage.getPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  });

  // Vitals
  app.get("/api/patients/:id/vitals", async (req, res) => {
    const vitals = await storage.getVitalsByPatient(req.params.id);
    res.json(vitals);
  });

  app.get("/api/patients/:id/vitals/latest", async (req, res) => {
    const vitals = await storage.getLatestVitals(req.params.id);
    if (!vitals) {
      return res.status(404).json({ message: "No vitals found" });
    }
    res.json(vitals);
  });

  app.post("/api/patients/:id/vitals", async (req, res) => {
    try {
      const vitalsData = insertVitalsSchema.parse({
        ...req.body,
        patientId: req.params.id,
      });
      const vitals = await storage.createVitals(vitalsData);
      res.json(vitals);
    } catch (error) {
      res.status(400).json({ message: "Invalid vitals data", error });
    }
  });

  // Lab results
  app.get("/api/patients/:id/labs", async (req, res) => {
    const labs = await storage.getLabsByPatient(req.params.id);
    res.json(labs);
  });

  app.get("/api/patients/:id/labs/latest", async (req, res) => {
    const labs = await storage.getLatestLabs(req.params.id);
    if (!labs) {
      return res.status(404).json({ message: "No lab results found" });
    }
    res.json(labs);
  });

  app.post("/api/patients/:id/labs", async (req, res) => {
    try {
      const labsData = insertLabResultsSchema.parse({
        ...req.body,
        patientId: req.params.id,
      });
      const labs = await storage.createLabs(labsData);
      res.json(labs);
    } catch (error) {
      res.status(400).json({ message: "Invalid lab data", error });
    }
  });

  // Alerts
  app.get("/api/alerts", async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  app.get("/api/alerts/active", async (req, res) => {
    const alerts = await storage.getActiveAlerts();
    res.json(alerts);
  });

  app.post("/api/alerts/:id/acknowledge", async (req, res) => {
    const { acknowledgedBy } = req.body;
    if (!acknowledgedBy) {
      return res.status(400).json({ message: "acknowledgedBy is required" });
    }
    
    const alert = await storage.acknowledgeAlert(req.params.id, acknowledgedBy);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    res.json(alert);
  });

  // Sensors
  app.get("/api/sensors", async (req, res) => {
    const sensors = await storage.getAllSensors();
    res.json(sensors);
  });

  app.get("/api/patients/:id/sensors", async (req, res) => {
    const sensors = await storage.getSensorsByPatient(req.params.id);
    res.json(sensors);
  });

  // Testing schedule
  app.get("/api/testing-schedule", async (req, res) => {
    const schedule = await storage.getTestingSchedule();
    if (!schedule) {
      return res.status(404).json({ message: "Testing schedule not found" });
    }
    res.json(schedule);
  });

  app.put("/api/testing-schedule", async (req, res) => {
    const schedule = await storage.updateTestingSchedule(req.body);
    res.json(schedule);
  });

  // Alert settings
  app.get("/api/alert-settings", async (req, res) => {
    const settings = await storage.getAlertSettings();
    if (!settings) {
      return res.status(404).json({ message: "Alert settings not found" });
    }
    res.json(settings);
  });

  app.put("/api/alert-settings", async (req, res) => {
    try {
      const settingsData = insertAlertSettingsSchema.parse(req.body);
      const settings = await storage.updateAlertSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data", error });
    }
  });

  // Statistics
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getPatientStats();
    res.json(stats);
  });

  // Seed demo data
  app.post("/api/seed-demo-data", async (req, res) => {
    await storage.seedDemoData();
    res.json({ message: "Demo data seeded successfully" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
