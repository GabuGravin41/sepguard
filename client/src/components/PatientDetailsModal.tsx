import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Activity } from "lucide-react";
import { type Patient, type Vitals, type LabResults } from "@shared/schema";
import { formatTimeAgo, getRiskScoreColor } from "@/lib/mockData";
import VitalsChart from "./VitalsChart";
import { useQuery } from "@tanstack/react-query";

interface PatientDetailsModalProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleRetest: (patient: Patient) => void;
  onEscalate: (patient: Patient) => void;
}

export default function PatientDetailsModal({
  patient,
  open,
  onOpenChange,
  onScheduleRetest,
  onEscalate,
}: PatientDetailsModalProps) {
  const { data: vitals } = useQuery({
    queryKey: ['/api/patients', patient?.id, 'vitals'],
    enabled: !!patient?.id,
  });

  const { data: labs } = useQuery({
    queryKey: ['/api/patients', patient?.id, 'labs'],
    enabled: !!patient?.id,
  });

  const { data: sensors } = useQuery({
    queryKey: ['/api/patients', patient?.id, 'sensors'],
    enabled: !!patient?.id,
  });

  if (!patient) return null;

  const latestVitals = vitals?.[0];
  const latestLabs = labs?.[0];
  const sensorsOnline = sensors?.filter(s => s.status === 'online').length || 0;
  const totalSensors = sensors?.length || 0;

  const getLabStatus = (value: string | null, normalRange: string) => {
    if (!value) return { status: 'pending', variant: 'secondary' as const };
    
    const numValue = parseFloat(value);
    // Simple heuristic - in real app this would be more sophisticated
    if (normalRange.includes('<') && numValue > parseFloat(normalRange.replace(/[^\d.]/g, ''))) {
      return { status: 'High', variant: 'destructive' as const };
    }
    if (normalRange.includes('>') && numValue < parseFloat(normalRange.replace(/[^\d.]/g, ''))) {
      return { status: 'Low', variant: 'destructive' as const };
    }
    return { status: 'Normal', variant: 'secondary' as const };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid={`patient-details-modal-${patient.id}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{patient.name}</h3>
              <p className="text-muted-foreground">
                {patient.room} • Age {patient.age} • Admitted {formatTimeAgo(patient.admissionDate)}
              </p>
            </div>
            <Badge variant={patient.status === 'critical' ? 'destructive' : 'secondary'}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <div className={`text-3xl font-bold mb-1 ${getRiskScoreColor(patient.currentRiskScore)}`}>
                {patient.currentRiskScore}
              </div>
              <p className="text-sm text-muted-foreground">Current Risk Score</p>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className={`h-4 w-4 mr-1 ${
                  patient.riskTrend === 'up' ? 'text-destructive' : 'text-primary'
                }`} />
                <span className="text-xs">
                  {patient.riskTrend === 'up' ? 'Increasing' : 'Stable'}
                </span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">
                {sensorsOnline}/{totalSensors}
              </div>
              <p className="text-sm text-muted-foreground">Sensors Online</p>
              <div className="flex items-center justify-center mt-2">
                <Activity className="h-4 w-4 mr-1 text-primary" />
                <span className="text-xs text-primary">All Connected</span>
              </div>
            </div>

            <div className="text-center p-4 bg-secondary/50 rounded-lg">
              <div className="text-3xl font-bold text-foreground mb-1">
                {latestVitals ? formatTimeAgo(latestVitals.timestamp) : 'N/A'}
              </div>
              <p className="text-sm text-muted-foreground">Last Update</p>
              <div className="flex items-center justify-center mt-2">
                <Users className="h-4 w-4 mr-1 text-foreground" />
                <span className="text-xs">Continuous Monitoring</span>
              </div>
            </div>
          </div>

          {/* Vitals Chart */}
          <VitalsChart 
            patientId={patient.id} 
            title={`24-Hour Vitals Trend - ${patient.name}`}
            height={300}
          />

          {/* Latest Lab Results */}
          {latestLabs && (
            <div className="bg-secondary/50 p-6 rounded-lg">
              <h4 className="font-semibold text-foreground mb-4">
                Latest Lab Results - {formatTimeAgo(latestLabs.timestamp)}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestLabs.lactate && (
                  <div className="p-4 bg-card rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Lactate</span>
                      <Badge variant={getLabStatus(latestLabs.lactate, '<2.0').variant}>
                        {getLabStatus(latestLabs.lactate, '<2.0').status}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-foreground">{latestLabs.lactate} mmol/L</div>
                    <p className="text-xs text-muted-foreground">Normal: &lt;2.0 mmol/L</p>
                  </div>
                )}

                {latestLabs.wbc && (
                  <div className="p-4 bg-card rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">WBC Count</span>
                      <Badge variant={getLabStatus(latestLabs.wbc, '4.0-11.0').variant}>
                        {parseFloat(latestLabs.wbc) > 11.0 ? 'Elevated' : 'Normal'}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-foreground">{latestLabs.wbc} K/μL</div>
                    <p className="text-xs text-muted-foreground">Normal: 4.0-11.0 K/μL</p>
                  </div>
                )}

                {latestLabs.crp && (
                  <div className="p-4 bg-card rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">C-Reactive Protein</span>
                      <Badge variant={getLabStatus(latestLabs.crp, '<3.0').variant}>
                        {parseFloat(latestLabs.crp) > 3.0 ? 'High' : 'Normal'}
                      </Badge>
                    </div>
                    <div className="text-xl font-bold text-foreground">{latestLabs.crp} mg/L</div>
                    <p className="text-xs text-muted-foreground">Normal: &lt;3.0 mg/L</p>
                  </div>
                )}

                <div className="p-4 bg-card rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Blood Culture</span>
                    <Badge variant="secondary">
                      {latestLabs.cultureStatus || 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {latestLabs.cultureStatus === 'pending' ? '24h incubation' : latestLabs.cultureStatus}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Drawn {formatTimeAgo(latestLabs.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => onScheduleRetest(patient)}
              data-testid={`button-schedule-retest-${patient.id}`}
            >
              Schedule Retest
            </Button>
            <Button
              variant="destructive"
              onClick={() => onEscalate(patient)}
              data-testid={`button-escalate-modal-${patient.id}`}
            >
              Escalate Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
