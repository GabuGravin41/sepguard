import { 
  type Patient, type InsertPatient,
  type Vitals, type InsertVitals,
  type LabResults, type InsertLabResults,
  type Alert, type InsertAlert,
  type Sensor, type InsertSensor,
  type TestingSchedule, type InsertTestingSchedule,
  type AlertSettings, type InsertAlertSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;

  // Vitals
  getVitalsByPatient(patientId: string): Promise<Vitals[]>;
  getLatestVitals(patientId: string): Promise<Vitals | undefined>;
  createVitals(vitals: InsertVitals): Promise<Vitals>;

  // Lab Results
  getLabsByPatient(patientId: string): Promise<LabResults[]>;
  getLatestLabs(patientId: string): Promise<LabResults | undefined>;
  createLabs(labs: InsertLabResults): Promise<LabResults>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | undefined>;

  // Sensors
  getSensorsByPatient(patientId: string): Promise<Sensor[]>;
  getAllSensors(): Promise<Sensor[]>;
  updateSensorStatus(id: string, status: string): Promise<Sensor | undefined>;

  // Testing Schedule
  getTestingSchedule(): Promise<TestingSchedule | undefined>;
  updateTestingSchedule(schedule: Partial<InsertTestingSchedule>): Promise<TestingSchedule>;

  // Alert Settings
  getAlertSettings(): Promise<AlertSettings | undefined>;
  updateAlertSettings(settings: Partial<InsertAlertSettings>): Promise<AlertSettings>;

  // Statistics
  getPatientStats(): Promise<{
    totalPatients: number;
    activeAlerts: number;
    criticalAlerts: number;
    highRiskPatients: number;
    sensorsOnline: number;
    totalSensors: number;
  }>;

  // Seed data
  seedDemoData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private patients: Map<string, Patient> = new Map();
  private vitals: Map<string, Vitals> = new Map();
  private labResults: Map<string, LabResults> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private sensors: Map<string, Sensor> = new Map();
  private testingSchedule: TestingSchedule | null = null;
  private alertSettings: AlertSettings | null = null;

  constructor() {
    this.initializeDemoData();
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) => b.currentRiskScore - a.currentRiskScore);
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = {
      id,
      name: insertPatient.name,
      room: insertPatient.room,
      age: insertPatient.age,
      admissionDate: insertPatient.admissionDate,
      status: insertPatient.status,
      currentRiskScore: insertPatient.currentRiskScore || 0,
      riskTrend: insertPatient.riskTrend || 'stable',
      createdAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: string, updateData: Partial<InsertPatient>): Promise<Patient | undefined> {
    const patient = this.patients.get(id);
    if (!patient) return undefined;

    const updatedPatient: Patient = { ...patient, ...updateData };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }

  async getVitalsByPatient(patientId: string): Promise<Vitals[]> {
    return Array.from(this.vitals.values())
      .filter(v => v.patientId === patientId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLatestVitals(patientId: string): Promise<Vitals | undefined> {
    const vitals = await this.getVitalsByPatient(patientId);
    return vitals[0];
  }

  async createVitals(insertVitals: InsertVitals): Promise<Vitals> {
    const id = randomUUID();
    const vitals: Vitals = {
      id,
      patientId: insertVitals.patientId,
      heartRate: insertVitals.heartRate || null,
      temperature: insertVitals.temperature || null,
      systolicBP: insertVitals.systolicBP || null,
      diastolicBP: insertVitals.diastolicBP || null,
      oxygenSaturation: insertVitals.oxygenSaturation || null,
      respiratoryRate: insertVitals.respiratoryRate || null,
      timestamp: new Date(),
    };
    this.vitals.set(id, vitals);
    return vitals;
  }

  async getLabsByPatient(patientId: string): Promise<LabResults[]> {
    return Array.from(this.labResults.values())
      .filter(l => l.patientId === patientId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getLatestLabs(patientId: string): Promise<LabResults | undefined> {
    const labs = await this.getLabsByPatient(patientId);
    return labs[0];
  }

  async createLabs(insertLabs: InsertLabResults): Promise<LabResults> {
    const id = randomUUID();
    const labs: LabResults = {
      id,
      patientId: insertLabs.patientId,
      lactate: insertLabs.lactate || null,
      wbc: insertLabs.wbc || null,
      crp: insertLabs.crp || null,
      cultureStatus: insertLabs.cultureStatus || null,
      timestamp: new Date(),
    };
    this.labResults.set(id, labs);
    return labs;
  }

  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(a => !a.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      id,
      patientId: insertAlert.patientId || null,
      type: insertAlert.type,
      message: insertAlert.message,
      source: insertAlert.source,
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      timestamp: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;

    const updatedAlert: Alert = {
      ...alert,
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async getSensorsByPatient(patientId: string): Promise<Sensor[]> {
    return Array.from(this.sensors.values()).filter(s => s.patientId === patientId);
  }

  async getAllSensors(): Promise<Sensor[]> {
    return Array.from(this.sensors.values());
  }

  async updateSensorStatus(id: string, status: string): Promise<Sensor | undefined> {
    const sensor = this.sensors.get(id);
    if (!sensor) return undefined;

    const updatedSensor: Sensor = {
      ...sensor,
      status,
      lastUpdate: new Date(),
    };
    this.sensors.set(id, updatedSensor);
    return updatedSensor;
  }

  async getTestingSchedule(): Promise<TestingSchedule | undefined> {
    return this.testingSchedule || undefined;
  }

  async updateTestingSchedule(schedule: Partial<InsertTestingSchedule>): Promise<TestingSchedule> {
    if (!this.testingSchedule) {
      const id = randomUUID();
      this.testingSchedule = {
        id,
        intervalHours: 2,
        lastRun: null,
        nextRun: null,
        vitalsCompleted: 0,
        labsCompleted: 0,
        riskCalculated: 0,
        totalPatients: 0,
        ...schedule,
      };
    } else {
      this.testingSchedule = { ...this.testingSchedule, ...schedule };
    }
    return this.testingSchedule;
  }

  async getAlertSettings(): Promise<AlertSettings | undefined> {
    return this.alertSettings || undefined;
  }

  async updateAlertSettings(settings: Partial<InsertAlertSettings>): Promise<AlertSettings> {
    if (!this.alertSettings) {
      const id = randomUUID();
      this.alertSettings = {
        id,
        criticalThreshold: 80,
        warningThreshold: 60,
        monitorThreshold: 40,
        audioAlerts: true,
        emailNotifications: false,
        smsAlerts: true,
        ...settings,
      };
    } else {
      this.alertSettings = { ...this.alertSettings, ...settings };
    }
    return this.alertSettings;
  }

  async getPatientStats() {
    const patients = Array.from(this.patients.values());
    const alerts = Array.from(this.alerts.values());
    const sensors = Array.from(this.sensors.values());

    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    const criticalAlerts = alerts.filter(a => !a.acknowledged && a.type === 'critical').length;
    const highRiskPatients = patients.filter(p => p.currentRiskScore >= 70).length;
    const sensorsOnline = sensors.filter(s => s.status === 'online').length;

    return {
      totalPatients: patients.length,
      activeAlerts,
      criticalAlerts,
      highRiskPatients,
      sensorsOnline,
      totalSensors: sensors.length,
    };
  }

  async seedDemoData(): Promise<void> {
    this.patients.clear();
    this.vitals.clear();
    this.labResults.clear();
    this.alerts.clear();
    this.sensors.clear();
    this.initializeDemoData();
  }

  private initializeDemoData(): void {
    // Create demo patients
    const demoPatients = [
      { name: "Maria Rodriguez", room: "302A", age: 67, riskScore: 85, status: "critical" },
      { name: "James Wilson", room: "205B", age: 54, riskScore: 72, status: "warning" },
      { name: "Eleanor Thompson", room: "418C", age: 78, riskScore: 91, status: "critical" },
      { name: "Robert Chen", room: "115A", age: 45, riskScore: 28, status: "stable" },
      { name: "Patricia Davis", room: "110A", age: 62, riskScore: 45, status: "stable" },
      { name: "Michael Brown", room: "307B", age: 58, riskScore: 68, status: "warning" },
      { name: "Lisa Johnson", room: "221C", age: 41, riskScore: 35, status: "stable" },
      { name: "David Miller", room: "156A", age: 73, riskScore: 76, status: "warning" },
    ];

    demoPatients.forEach(p => {
      const id = randomUUID();
      const patient: Patient = {
        id,
        name: p.name,
        room: p.room,
        age: p.age,
        admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: p.status,
        currentRiskScore: p.riskScore,
        riskTrend: p.riskScore > 70 ? 'up' : 'stable',
        createdAt: new Date(),
      };
      this.patients.set(id, patient);

      // Create vitals for each patient
      const vitalsId = randomUUID();
      const vitals: Vitals = {
        id: vitalsId,
        patientId: id,
        heartRate: p.status === 'critical' ? 110 + Math.floor(Math.random() * 20) : 
                   p.status === 'warning' ? 85 + Math.floor(Math.random() * 15) : 
                   70 + Math.floor(Math.random() * 10),
        temperature: p.status === 'critical' ? "101.0" : 
                    p.status === 'warning' ? "99.8" : "98.6",
        systolicBP: p.status === 'critical' ? 90 + Math.floor(Math.random() * 10) : 120,
        diastolicBP: p.status === 'critical' ? 55 + Math.floor(Math.random() * 10) : 80,
        oxygenSaturation: p.status === 'critical' ? 92 + Math.floor(Math.random() * 3) : 98,
        respiratoryRate: p.status === 'critical' ? 20 + Math.floor(Math.random() * 5) : 16,
        timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
      };
      this.vitals.set(vitalsId, vitals);

      // Create lab results
      const labsId = randomUUID();
      const labs: LabResults = {
        id: labsId,
        patientId: id,
        lactate: p.status === 'critical' ? "4.2" : "2.1",
        wbc: p.status === 'critical' ? "15.2" : "8.5",
        crp: p.status === 'critical' ? "89" : "5",
        cultureStatus: p.status === 'critical' ? 'pending' : 'negative',
        timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
      };
      this.labResults.set(labsId, labs);

      // Create sensors
      ['heart_rate', 'temperature', 'blood_pressure', 'oxygen'].forEach(sensorType => {
        const sensorId = randomUUID();
        const sensor: Sensor = {
          id: sensorId,
          patientId: id,
          sensorType,
          status: Math.random() > 0.1 ? 'online' : 'offline',
          lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        };
        this.sensors.set(sensorId, sensor);
      });
    });

    // Create demo alerts
    const demoAlerts = [
      { type: "critical", message: "Lactate level critically elevated at 4.2 mmol/L (normal: <2.0). Immediate physician review required.", source: "Automated Lab Analysis" },
      { type: "warning", message: "Temperature spike detected: 101.8°F. Monitoring increased frequency recommended.", source: "Vital Signs Monitor" },
      { type: "info", message: "Scheduled laboratory results are due. Please collect blood samples for analysis.", source: "Testing Schedule" },
    ];

    demoAlerts.forEach(a => {
      const id = randomUUID();
      const alert: Alert = {
        id,
        patientId: Array.from(this.patients.keys())[0],
        type: a.type,
        message: a.message,
        source: a.source,
        acknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      };
      this.alerts.set(id, alert);
    });

    // Initialize testing schedule
    const scheduleId = randomUUID();
    this.testingSchedule = {
      id: scheduleId,
      intervalHours: 2,
      lastRun: new Date(Date.now() - 37 * 60 * 1000),
      nextRun: new Date(Date.now() + 23 * 60 * 1000),
      vitalsCompleted: 16,
      labsCompleted: 12,
      riskCalculated: 18,
      totalPatients: 18,
    };

    // Initialize alert settings
    const settingsId = randomUUID();
    this.alertSettings = {
      id: settingsId,
      criticalThreshold: 80,
      warningThreshold: 60,
      monitorThreshold: 40,
      audioAlerts: true,
      emailNotifications: false,
      smsAlerts: true,
    };
  }
}

export const storage = new MemStorage();
