import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Camera, Save, Upload, Check, Edit } from "lucide-react";
import { insertVitalsSchema, insertLabResultsSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const vitalsFormSchema = insertVitalsSchema.extend({
  patientId: z.string().min(1, "Please select a patient"),
});

const labsFormSchema = insertLabResultsSchema.extend({
  patientId: z.string().min(1, "Please select a patient"),
});

type VitalsFormData = z.infer<typeof vitalsFormSchema>;
type LabsFormData = z.infer<typeof labsFormSchema>;

interface OCRResult {
  field: string;
  value: string;
  confidence: number;
}

export default function ManualEntry() {
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [selectedPatientForLabs, setSelectedPatientForLabs] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const vitalsForm = useForm<VitalsFormData>({
    resolver: zodResolver(vitalsFormSchema),
    defaultValues: {
      patientId: "",
      heartRate: undefined,
      temperature: undefined,
      systolicBP: undefined,
      diastolicBP: undefined,
      oxygenSaturation: undefined,
      respiratoryRate: undefined,
    },
  });

  const labsForm = useForm<LabsFormData>({
    resolver: zodResolver(labsFormSchema),
    defaultValues: {
      patientId: "",
      lactate: undefined,
      wbc: undefined,
      crp: undefined,
      cultureStatus: undefined,
    },
  });

  const submitVitalsMutation = useMutation({
    mutationFn: (data: VitalsFormData) => 
      apiRequest('POST', `/api/patients/${data.patientId}/vitals`, {
        heartRate: data.heartRate,
        temperature: data.temperature?.toString(),
        systolicBP: data.systolicBP,
        diastolicBP: data.diastolicBP,
        oxygenSaturation: data.oxygenSaturation,
        respiratoryRate: data.respiratoryRate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      vitalsForm.reset();
      toast({
        title: "Vitals submitted",
        description: "Patient vitals have been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit vitals. Please check the data and try again.",
        variant: "destructive",
      });
    },
  });

  const submitLabsMutation = useMutation({
    mutationFn: (data: LabsFormData) => 
      apiRequest('POST', `/api/patients/${data.patientId}/labs`, {
        lactate: data.lactate?.toString(),
        wbc: data.wbc?.toString(),
        crp: data.crp?.toString(),
        cultureStatus: data.cultureStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      labsForm.reset();
      setShowOcrResults(false);
      setOcrResults([]);
      toast({
        title: "Lab results submitted",
        description: "Lab results have been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit lab results. Please check the data and try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = () => {
    // Simulate OCR processing
    toast({
      title: "Processing image",
      description: "AI is analyzing the lab results...",
    });

    setTimeout(() => {
      const mockResults: OCRResult[] = [
        { field: "lactate", value: "2.1", confidence: 98 },
        { field: "wbc", value: "12.8", confidence: 95 },
        { field: "crp", value: "45", confidence: 78 },
      ];
      
      setOcrResults(mockResults);
      setShowOcrResults(true);
      
      // Pre-fill the form with OCR results
      mockResults.forEach(result => {
        if (result.field === "lactate") labsForm.setValue("lactate", parseFloat(result.value));
        if (result.field === "wbc") labsForm.setValue("wbc", parseFloat(result.value));
        if (result.field === "crp") labsForm.setValue("crp", parseFloat(result.value));
      });
      
      toast({
        title: "Image processed",
        description: "Lab results have been extracted successfully.",
      });
    }, 2000);
  };

  const updateOcrValue = (field: string, value: string) => {
    setOcrResults(prev => 
      prev.map(result => 
        result.field === field ? { ...result, value } : result
      )
    );
    
    // Update form value
    if (field === "lactate") labsForm.setValue("lactate", parseFloat(value));
    if (field === "wbc") labsForm.setValue("wbc", parseFloat(value));
    if (field === "crp") labsForm.setValue("crp", parseFloat(value));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "bg-primary/10 text-primary";
    if (confidence >= 80) return "bg-amber-500/10 text-amber-600";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Vitals Entry */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Enter Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...vitalsForm}>
              <form 
                onSubmit={vitalsForm.handleSubmit((data) => submitVitalsMutation.mutate(data))}
                className="space-y-4"
                data-testid="vitals-form"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vitalsForm.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Room</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-patient-vitals">
                              <SelectValue placeholder="Select Room" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients?.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.room} - {patient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="timestamp">Timestamp</Label>
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      data-testid="input-vitals-timestamp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vitalsForm.control}
                    name="heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="72" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-heart-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vitalsForm.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°F)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="98.6" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-temperature"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vitalsForm.control}
                    name="systolicBP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Systolic BP</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="120" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-systolic-bp"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vitalsForm.control}
                    name="diastolicBP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diastolic BP</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="80" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-diastolic-bp"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vitalsForm.control}
                    name="oxygenSaturation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>O2 Saturation (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="99" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-oxygen-saturation"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vitalsForm.control}
                    name="respiratoryRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respiratory Rate</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="16" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-respiratory-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitVitalsMutation.isPending}
                  data-testid="button-submit-vitals"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitVitalsMutation.isPending ? 'Submitting...' : 'Submit Vitals'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* OCR Lab Upload */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Upload Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Selection for Labs */}
            <div>
              <Label htmlFor="lab-patient">Select Patient</Label>
              <Select value={selectedPatientForLabs} onValueChange={(value) => {
                setSelectedPatientForLabs(value);
                labsForm.setValue("patientId", value);
              }}>
                <SelectTrigger data-testid="select-patient-labs">
                  <SelectValue placeholder="Select patient for lab results" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.room} - {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!showOcrResults ? (
              <div>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={handleFileUpload}
                  data-testid="ocr-upload-area"
                >
                  <div className="w-16 h-16 bg-accent/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Camera className="text-accent h-8 w-8" />
                  </div>
                  <p className="font-medium text-foreground mb-2">Upload Lab Screenshot</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI will automatically parse the results
                  </p>
                  <Button variant="secondary" data-testid="button-choose-file">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                </div>
              </div>
            ) : (
              <div data-testid="ocr-results">
                <h4 className="font-semibold text-foreground mb-3">Parsed Results</h4>
                <div className="space-y-3">
                  {ocrResults.map((result) => (
                    <div key={result.field} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium capitalize">
                          {result.field === 'wbc' ? 'WBC' : result.field}
                        </span>
                        <Badge className={getConfidenceColor(result.confidence)}>
                          {result.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          value={result.value}
                          onChange={(e) => updateOcrValue(result.field, e.target.value)}
                          className="w-24 text-sm"
                          data-testid={`input-ocr-${result.field}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {result.field === 'lactate' ? 'mmol/L' : 
                           result.field === 'wbc' ? 'K/μL' : 
                           result.field === 'crp' ? 'mg/L' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 mt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      if (selectedPatientForLabs) {
                        submitLabsMutation.mutate({
                          patientId: selectedPatientForLabs,
                          lactate: labsForm.getValues("lactate"),
                          wbc: labsForm.getValues("wbc"),
                          crp: labsForm.getValues("crp"),
                          cultureStatus: labsForm.getValues("cultureStatus"),
                        });
                      }
                    }}
                    disabled={submitLabsMutation.isPending || !selectedPatientForLabs}
                    data-testid="button-accept-ocr"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {submitLabsMutation.isPending ? 'Submitting...' : 'Accept & Submit'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowOcrResults(false)}
                    data-testid="button-edit-ocr"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Lab Entry (shown when OCR is not active) */}
      {!showOcrResults && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Manual Lab Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...labsForm}>
              <form 
                onSubmit={labsForm.handleSubmit((data) => submitLabsMutation.mutate(data))}
                className="space-y-4"
                data-testid="labs-form"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={labsForm.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-patient-manual-labs">
                              <SelectValue placeholder="Select Patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients?.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.room} - {patient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={labsForm.control}
                    name="cultureStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Culture Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-culture-status">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={labsForm.control}
                    name="lactate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lactate (mmol/L)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="2.0" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-lactate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={labsForm.control}
                    name="wbc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WBC (K/μL)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="7.5" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-wbc"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={labsForm.control}
                    name="crp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRP (mg/L)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="3.0" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            data-testid="input-crp"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-auto" 
                  disabled={submitLabsMutation.isPending}
                  data-testid="button-submit-labs"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {submitLabsMutation.isPending ? 'Submitting...' : 'Submit Lab Results'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
