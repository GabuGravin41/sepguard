import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Save, Bell, Mail, MessageSquare } from "lucide-react";
import { insertAlertSettingsSchema, type AlertSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const settingsFormSchema = insertAlertSettingsSchema;
type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alertSettings, isLoading } = useQuery({
    queryKey: ['/api/alert-settings'],
  }) as { data: AlertSettings | undefined; isLoading: boolean };

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      criticalThreshold: 80,
      warningThreshold: 60,
      monitorThreshold: 40,
      audioAlerts: true,
      emailNotifications: false,
      smsAlerts: true,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (alertSettings) {
      form.reset({
        criticalThreshold: alertSettings.criticalThreshold,
        warningThreshold: alertSettings.warningThreshold,
        monitorThreshold: alertSettings.monitorThreshold,
        audioAlerts: alertSettings.audioAlerts,
        emailNotifications: alertSettings.emailNotifications,
        smsAlerts: alertSettings.smsAlerts,
      });
    }
  }, [alertSettings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormData) => 
      apiRequest('PUT', '/api/alert-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alert-settings'] });
      toast({
        title: "Settings saved",
        description: "Alert configuration has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score Thresholds */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Risk Score Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="criticalThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Critical Alert
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Score ≥</span>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20 text-center"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-critical-threshold"
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormDescription>
                        Patients with risk scores at or above this threshold will trigger critical alerts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warningThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Warning Alert
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Score ≥</span>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20 text-center"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-warning-threshold"
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormDescription>
                        Patients with risk scores at or above this threshold will trigger warning alerts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monitorThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-foreground">
                          Monitor Alert
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Score ≥</span>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20 text-center"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-monitor-threshold"
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormDescription>
                        Patients with risk scores at or above this threshold will be flagged for monitoring
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Threshold Preview */}
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-3">Threshold Preview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-destructive">Critical (≥{form.watch('criticalThreshold')})</span>
                      <div className="flex-1 mx-2 h-2 bg-gradient-to-r from-destructive to-destructive rounded"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600">Warning ({form.watch('warningThreshold')}-{form.watch('criticalThreshold') - 1})</span>
                      <div className="flex-1 mx-2 h-2 bg-gradient-to-r from-amber-500 to-amber-500 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-primary">Monitor ({form.watch('monitorThreshold')}-{form.watch('warningThreshold') - 1})</span>
                      <div className="flex-1 mx-2 h-2 bg-gradient-to-r from-primary to-primary rounded"></div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Stable (&lt;{form.watch('monitorThreshold') || 40})</span>
                      <div className="flex-1 mx-2 h-2 bg-gradient-to-r from-muted to-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="audioAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-foreground" />
                          <FormLabel className="text-sm font-medium text-foreground">
                            Audio Alerts
                          </FormLabel>
                        </div>
                        <FormDescription>
                          Play sound notifications for critical alerts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-audio-alerts"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-foreground" />
                          <FormLabel className="text-sm font-medium text-foreground">
                            Email Notifications
                          </FormLabel>
                        </div>
                        <FormDescription>
                          Send email notifications for critical alerts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-email-notifications"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smsAlerts"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-foreground" />
                          <FormLabel className="text-sm font-medium text-foreground">
                            SMS Alerts
                          </FormLabel>
                        </div>
                        <FormDescription>
                          Send text messages for emergency situations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-sms-alerts"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Bell className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Notification Settings
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Critical alerts will always be displayed in the dashboard regardless of these settings. 
                        Configure external notifications based on your workflow preferences.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Additional Configuration Info */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Configuration Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Risk Score Calculation</h4>
              <p className="text-sm text-muted-foreground">
                Risk scores are calculated based on multiple factors including vital signs, 
                lab results, and patient history. The system automatically updates scores 
                every time new data is received.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Alert Response</h4>
              <p className="text-sm text-muted-foreground">
                All alerts require acknowledgment to be dismissed. Critical alerts will 
                continue to appear until acknowledged by clinical staff. Response times 
                are logged for quality assurance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
