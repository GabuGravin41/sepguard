import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle } from "lucide-react";
import { calculateTimeUntilNext, getProgressPercentage } from "@/lib/mockData";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Testing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testingSchedule } = useQuery({
    queryKey: ['/api/testing-schedule'],
    refetchInterval: 60000,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: (data: { intervalHours: number }) => 
      apiRequest('PUT', '/api/testing-schedule', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testing-schedule'] });
      toast({
        title: "Schedule updated",
        description: "Testing schedule has been updated successfully.",
      });
    },
  });

  const runManualTestMutation = useMutation({
    mutationFn: () => {
      // Simulate running manual test
      return new Promise(resolve => setTimeout(resolve, 2000));
    },
    onSuccess: () => {
      toast({
        title: "Manual test completed",
        description: "All patients have been assessed successfully.",
      });
    },
  });

  const scheduleProgress = testingSchedule?.lastRun && testingSchedule?.nextRun 
    ? getProgressPercentage(testingSchedule.lastRun, testingSchedule.nextRun)
    : 0;

  // Mock recent test results
  const recentTests = [
    {
      id: '1',
      type: 'Full Assessment',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      processed: 18,
      status: 'completed'
    },
    {
      id: '2',
      type: 'Vitals Check',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      processed: 16,
      status: 'completed'
    },
    {
      id: '3',
      type: 'Lab Analysis',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      processed: 12,
      status: 'completed'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Testing Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Testing Interval</label>
              <Select 
                value={testingSchedule?.intervalHours?.toString() || "2"}
                onValueChange={(value) => updateScheduleMutation.mutate({ intervalHours: parseInt(value) })}
                data-testid="select-testing-interval"
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1 hour</SelectItem>
                  <SelectItem value="2">Every 2 hours</SelectItem>
                  <SelectItem value="4">Every 4 hours</SelectItem>
                  <SelectItem value="6">Every 6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {testingSchedule && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Next Automated Run</span>
                    <span className="text-sm text-primary font-medium">
                      {calculateTimeUntilNext(testingSchedule.nextRun!)}
                    </span>
                  </div>
                  <Progress value={scheduleProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Last run: {new Date(testingSchedule.lastRun!).toLocaleTimeString()}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Vitals</p>
                    <p className="text-lg font-bold text-primary">
                      {testingSchedule.vitalsCompleted}/{testingSchedule.totalPatients}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Labs</p>
                    <p className="text-lg font-bold text-accent">
                      {testingSchedule.labsCompleted}/{testingSchedule.totalPatients}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Risk Calc</p>
                    <p className="text-lg font-bold text-chart-3">
                      {testingSchedule.riskCalculated}/{testingSchedule.totalPatients}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button 
              className="w-full" 
              onClick={() => runManualTestMutation.mutate()}
              disabled={runManualTestMutation.isPending}
              data-testid="button-run-manual-test"
            >
              <Play className={`mr-2 h-4 w-4 ${runManualTestMutation.isPending ? 'animate-spin' : ''}`} />
              {runManualTestMutation.isPending ? 'Running Test...' : 'Run Manual Test'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Test Results */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{test.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {test.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {test.processed} patients
                    </p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Test History (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 12 }, (_, i) => {
              const time = new Date(Date.now() - i * 2 * 60 * 60 * 1000);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      {time.toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Automated Assessment
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">18 patients processed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
