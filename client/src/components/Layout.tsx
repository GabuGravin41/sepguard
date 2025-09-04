import { useState } from "react";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const pageTitles = {
  '/': { title: 'Dashboard Overview', subtitle: 'Real-time sepsis monitoring and risk assessment' },
  '/patients': { title: 'Patient Monitoring', subtitle: 'Monitor all patients and their sepsis risk levels' },
  '/alerts': { title: 'Alert Management', subtitle: 'Review and acknowledge system alerts' },
  '/testing': { title: 'Automated Testing', subtitle: 'Manage testing schedules and run manual assessments' },
  '/sensors': { title: 'Sensor Management', subtitle: 'Monitor sensor connectivity and health status' },
  '/manual-entry': { title: 'Manual Data Entry', subtitle: 'Enter patient vitals and lab results manually' },
  '/settings': { title: 'Alert Configuration', subtitle: 'Configure alert thresholds and notification settings' }
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const seedDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/seed-demo-data'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Demo data refreshed",
        description: "All patient data has been regenerated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  });

  const currentPageInfo = pageTitles[currentPath as keyof typeof pageTitles] || pageTitles['/'];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPath={currentPath} onPathChange={setCurrentPath} />
      
      <main className="flex-1 overflow-auto">
        <header className="glass-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{currentPageInfo.title}</h2>
              <p className="text-muted-foreground">{currentPageInfo.subtitle}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => seedDataMutation.mutate()}
                disabled={seedDataMutation.isPending}
                data-testid="button-seed-demo-data"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${seedDataMutation.isPending ? 'animate-spin' : ''}`} />
                {seedDataMutation.isPending ? 'Refreshing...' : 'Seed Demo Data'}
              </Button>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span data-testid="text-current-time">{currentTime}</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
