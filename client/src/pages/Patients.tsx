import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import PatientCard from "@/components/PatientCard";
import PatientDetailsModal from "@/components/PatientDetailsModal";
import { type Patient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Patients() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
    refetchInterval: 30000,
  });

  // Get vitals for all patients
  const patientVitalsQueries = useQuery({
    queryKey: ['/api/patients/vitals'],
    enabled: !!patients?.length,
  });

  const filteredPatients = patients?.filter(patient => {
    switch (filter) {
      case 'high-risk':
        return patient.currentRiskScore >= 70;
      case 'critical':
        return patient.status === 'critical';
      default:
        return true;
    }
  }) || [];

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleEscalate = (patient: Patient) => {
    toast({
      title: "Patient escalated",
      description: `${patient.name} has been escalated to the attending physician`,
      variant: patient.status === 'critical' ? 'destructive' : 'default',
    });
  };

  const handleScheduleRetest = (patient: Patient) => {
    toast({
      title: "Retest scheduled",
      description: `Lab retest scheduled for ${patient.name}`,
    });
    setSelectedPatient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48" data-testid="select-patient-filter">
              <SelectValue placeholder="Filter patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="high-risk">High Risk Only</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Showing {filteredPatients.length} of {patients?.length || 0} patients
          </div>
        </div>
        <Button data-testid="button-add-patient">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Patient Grid */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {filter === 'all' ? 'No patients found' : `No ${filter.replace('-', ' ')} patients found`}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => {
            // Get latest vitals for this patient
            const vitals = patientVitalsQueries.data?.find(v => v.patientId === patient.id);
            
            return (
              <PatientCard
                key={patient.id}
                patient={patient}
                vitals={vitals}
                onViewDetails={handleViewDetails}
                onEscalate={handleEscalate}
              />
            );
          })}
        </div>
      )}

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
