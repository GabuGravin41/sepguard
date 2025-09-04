import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Patient, type Vitals } from "@shared/schema";
import { formatTimeAgo, getRiskScoreColor, getStatusIndicator, formatVitalValue } from "@/lib/mockData";

interface PatientCardProps {
  patient: Patient;
  vitals?: Vitals;
  onViewDetails: (patient: Patient) => void;
  onEscalate: (patient: Patient) => void;
}

export default function PatientCard({ patient, vitals, onViewDetails, onEscalate }: PatientCardProps) {
  const getRiskBadgeVariant = (score: number) => {
    if (score >= 80) return 'destructive';
    if (score >= 60) return 'outline';
    return 'secondary';
  };

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      case 'stable': return 'Stable';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="glass-card hover-lift" data-testid={`patient-card-${patient.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className={`status-indicator ${getStatusIndicator(patient.status)}`}></span>
            <div>
              <h4 className="font-semibold text-foreground" data-testid={`patient-name-${patient.id}`}>
                {patient.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {patient.room} • Age {patient.age}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getRiskScoreColor(patient.currentRiskScore)}`}>
              {patient.currentRiskScore}
            </div>
            <div className="text-xs text-muted-foreground">Risk Score</div>
          </div>
        </div>

        {vitals && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-muted-foreground">Heart Rate</p>
              <p className="font-medium" data-testid={`vitals-hr-${patient.id}`}>
                {formatVitalValue(vitals.heartRate, 'bpm')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Temperature</p>
              <p className="font-medium" data-testid={`vitals-temp-${patient.id}`}>
                {formatVitalValue(vitals.temperature, '°F')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Blood Pressure</p>
              <p className="font-medium" data-testid={`vitals-bp-${patient.id}`}>
                {vitals.systolicBP && vitals.diastolicBP 
                  ? `${vitals.systolicBP}/${vitals.diastolicBP} mmHg`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">O2 Saturation</p>
              <p className="font-medium" data-testid={`vitals-o2-${patient.id}`}>
                {formatVitalValue(vitals.oxygenSaturation, '%')}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>
            {vitals ? `Updated ${formatTimeAgo(vitals.timestamp)}` : 'No recent vitals'}
          </span>
          <span>
            Admitted {formatTimeAgo(patient.admissionDate)}
          </span>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Badge variant={getRiskBadgeVariant(patient.currentRiskScore)}>
            {getStatusBadgeText(patient.status)}
          </Badge>
          {patient.riskTrend === 'up' && (
            <Badge variant="outline" className="text-destructive">
              Rising Risk
            </Badge>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            className="flex-1"
            onClick={() => onViewDetails(patient)}
            data-testid={`button-view-details-${patient.id}`}
          >
            View Details
          </Button>
          <Button
            variant={patient.status === 'critical' ? 'destructive' : 'outline'}
            onClick={() => onEscalate(patient)}
            data-testid={`button-escalate-${patient.id}`}
          >
            {patient.status === 'critical' ? 'Escalate' : 'Monitor'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
