import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import AlertsList from "@/components/AlertsList";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ['/api/alerts'],
    refetchInterval: 10000,
  });

  const acknowledgeAllMutation = useMutation({
    mutationFn: async () => {
      const activeAlerts = alerts?.filter(alert => !alert.acknowledged) || [];
      const promises = activeAlerts.map(alert =>
        apiRequest('POST', `/api/alerts/${alert.id}/acknowledge`, { 
          acknowledgedBy: 'Dr. Sarah Chen' 
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      toast({
        title: "All alerts acknowledged",
        description: "All active alerts have been successfully acknowledged.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge all alerts. Please try again.",
        variant: "destructive",
      });
    },
  });

  const activeAlerts = alerts?.filter(alert => !alert.acknowledged) || [];
  const acknowledgedAlerts = alerts?.filter(alert => alert.acknowledged) || [];

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            {activeAlerts.length} active alerts, {acknowledgedAlerts.length} acknowledged
          </p>
        </div>
        {activeAlerts.length > 0 && (
          <Button
            onClick={() => acknowledgeAllMutation.mutate()}
            disabled={acknowledgeAllMutation.isPending}
            data-testid="button-acknowledge-all"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {acknowledgeAllMutation.isPending ? 'Acknowledging...' : 'Acknowledge All'}
          </Button>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Active Alerts</h3>
          <AlertsList alerts={activeAlerts} showHeader={false} />
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Recently Acknowledged</h3>
          <AlertsList alerts={acknowledgedAlerts.slice(0, 5)} showHeader={false} />
        </div>
      )}

      {/* Empty State */}
      {alerts?.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No alerts found</div>
        </div>
      )}
    </div>
  );
}
