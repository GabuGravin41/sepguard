import { useQuery } from "@tanstack/react-query";
import { Users, Bell, AlertTriangle, Wifi } from "lucide-react";
import StatTile from "@/components/StatTile";
import AlertsList from "@/components/AlertsList";
import VitalsChart from "@/components/VitalsChart";
import PatientCard from "@/components/PatientCard";
import PatientDetailsModal from "@/components/PatientDetailsModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { type Patient } from "@shared/schema";
import { calculateTimeUntilNext, getProgressPercentage } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
    refetchInterval: 30000,
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ['/api/alerts/active'],
    refetchInterval: 10000,
  });

  const { data: testingSchedule } = useQuery({
    queryKey: ['/api/testing-schedule'],
    refetchInterval: 60000,
  });

  const { data: sensors } = useQuery({
    queryKey: ['/api/sensors'],
    refetchInterval: 30000,
  });

  // Get high-risk patients (score >= 70)
  const highRiskPatients = patients?.filter(p => p.currentRiskScore >= 70).slice(0, 3) || [];

  // Get vitals for high-risk patients
  const { data: patientVitals } = useQuery({
    queryKey: ['/api/patients', 'vitals'],
    enabled: highRiskPatients.length > 0,
  });

  const handleScheduleRetest = (patient: Patient) => {
    toast({
      title: "Retest scheduled",
      description: `Lab retest scheduled for ${patient.name}`,
    });
    setSelectedPatient(null);
  };

  const handleEscalate = (patient: Patient) => {
    toast({
      title: "Patient escalated",
      description: `${patient.name} has been escalated to the attending physician`,
      variant: patient.status === 'critical' ? 'destructive' : 'default',
    });
    setSelectedPatient(null);
  };

  const sensorStats = sensors?.reduce((acc, sensor) => {
    acc[sensor.sensorType] = acc[sensor.sensorType] || { online: 0, total: 0 };
    acc[sensor.sensorType].total++;
    if (sensor.status === 'online') {
      acc[sensor.sensorType].online++;
    }
    return acc;
  }, {} as Record<string, { online: number; total: number }>) || {};

  const scheduleProgress = testingSchedule?.lastRun && testingSchedule?.nextRun 
    ? getProgressPercentage(testingSchedule.lastRun, testingSchedule.nextRun)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile
          title="Total Patients"
          value={stats?.totalPatients || 0}
          change="2 new admissions"
          changeType="positive"
          icon={Users}
        />
        <StatTile
          title="Active Alerts"
          value={stats?.activeAlerts || 0}
          change={`${stats?.criticalAlerts || 0} critical`}
          changeType="negative"
          icon={Bell}
          iconColor="text-destructive"
        />
        <StatTile
          title="High Risk Patients"
          value={stats?.highRiskPatients || 0}
          change="Score > 70"
          changeType="neutral"
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatTile
          title="Sensor Status"
          value={`${stats?.sensorsOnline || 0}/${stats?.totalSensors || 0}`}
          change={`${Math.round(((stats?.sensorsOnline || 0) / (stats?.totalSensors || 1)) * 100)}% online`}
          changeType="positive"
          icon={Wifi}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* High Risk Patients */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  High Risk Patients
                </CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-patients">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {highRiskPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No high-risk patients at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {highRiskPatients.map((patient) => {
                    const vitals = patientVitals?.find(v => v.patientId === patient.id);
                    return (
                      <div key={patient.id} className="p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <span className={`status-indicator ${
                                patient.status === 'critical' ? 'status-critical' : 'status-warning'
                              }`}></span>
                              <span className="text-sm font-medium">{patient.room}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{patient.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Age {patient.age} • Admitted {Math.floor(Math.random() * 7) + 1} days ago
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`text-sm font-bold ${
                                patient.currentRiskScore >= 80 ? 'text-destructive' : 'text-amber-600'
                              }`}>
                                {patient.currentRiskScore}
                              </p>
                              <p className="text-xs text-muted-foreground">Risk Score</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {vitals ? '2 min ago' : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">Last Update</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setSelectedPatient(patient)}
                              data-testid={`button-view-details-dashboard-${patient.id}`}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts & Testing Schedule */}
        <div className="space-y-6">
          {/* Recent Alerts */}
          <div className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Recent Alerts
                </CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-alerts">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AlertsList 
                alerts={activeAlerts?.slice(0, 3) || []} 
                showHeader={false}
                maxItems={3}
              />
            </CardContent>
          </div>

          {/* Testing Schedule */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Testing Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testingSchedule ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Next Round</span>
                      <span className="text-sm text-primary font-medium">
                        {testingSchedule.nextRun ? calculateTimeUntilNext(testingSchedule.nextRun) : 'N/A'}
                      </span>
                    </div>
                    <Progress value={scheduleProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Last run: {testingSchedule.lastRun 
                        ? new Date(testingSchedule.lastRun).toLocaleTimeString() 
                        : 'Never'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vitals Check</span>
                      <span className="text-foreground font-medium">
                        {testingSchedule.vitalsCompleted}/{testingSchedule.totalPatients}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lab Results</span>
                      <span className="text-foreground font-medium">
                        {testingSchedule.labsCompleted}/{testingSchedule.totalPatients}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk Update</span>
                      <span className="text-foreground font-medium">
                        {testingSchedule.riskCalculated}/{testingSchedule.totalPatients}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" variant="secondary" data-testid="button-run-manual-test">
                    Run Manual Test
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No testing schedule configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sensor Overview */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Sensor Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(sensorStats).map(([type, stats]) => (
                <div key={type} className="text-center p-4 bg-secondary/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Wifi className="text-primary-foreground h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {type.replace('_', ' ')}
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {stats.online}/{stats.total}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Trends */}
        <VitalsChart title="Risk Score Trends (24h)" height={250} />
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        open={!!selectedPatient}
        onOpenChange={(open) => !open && setSelectedPatient(null)}
        onScheduleRetest={handleScheduleRetest}
        onEscalate={handleEscalate}
      />
    </div>
  );
}
