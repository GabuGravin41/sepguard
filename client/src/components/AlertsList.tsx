import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { type Alert } from "@shared/schema";
import { formatTimeAgo } from "@/lib/mockData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AlertsListProps {
  alerts: Alert[];
  showHeader?: boolean;
  maxItems?: number;
}

export default function AlertsList({ alerts, showHeader = true, maxItems }: AlertsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => 
      apiRequest('POST', `/api/alerts/${alertId}/acknowledge`, { 
        acknowledgedBy: 'Dr. Sarah Chen' 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      toast({
        title: "Alert acknowledged",
        description: "The alert has been successfully acknowledged.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'info':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;

  return (
    <Card className="glass-card">
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {alerts.length > 0 ? `Active Alerts (${alerts.length})` : 'No Active Alerts'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={showHeader ? "" : "p-0"}>
        {displayAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                data-testid={`alert-item-${alert.id}`}
              >
                <div className="flex items-start space-x-4 flex-1">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getAlertBadgeVariant(alert.type)} className="text-xs">
                        {alert.type.toUpperCase()}
                      </Badge>
                      {alert.patientId && (
                        <span className="text-sm font-medium text-foreground">
                          Patient Alert
                        </span>
                      )}
                    </div>
                    <p className="text-foreground mb-2 text-sm" data-testid={`alert-message-${alert.id}`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{formatTimeAgo(alert.timestamp)}</span>
                      <span>{alert.source}</span>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button
                    size="sm"
                    variant={alert.type === 'critical' ? 'destructive' : 'outline'}
                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                    disabled={acknowledgeAlertMutation.isPending}
                    data-testid={`button-acknowledge-${alert.id}`}
                  >
                    {acknowledgeAlertMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
