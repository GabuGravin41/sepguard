import { Shield, BarChart3, Users, Bell, FlaskConical, Wifi, Keyboard, Settings, Sun, Moon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

export default function Sidebar({ currentPath, onPathChange }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ['/api/alerts/active'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const handleNavigation = (path: string) => {
    setLocation(path);
    onPathChange(path);
  };

  const navigationItems = [
    {
      path: '/',
      icon: BarChart3,
      label: 'Dashboard',
      badge: activeAlerts?.length || 0,
      badgeVariant: 'default' as const,
    },
    {
      path: '/patients',
      icon: Users,
      label: 'Patients',
      badge: stats?.totalPatients || 0,
      badgeVariant: 'secondary' as const,
    },
    {
      path: '/alerts',
      icon: Bell,
      label: 'Alerts',
      badge: activeAlerts?.length || 0,
      badgeVariant: 'destructive' as const,
    },
    {
      path: '/testing',
      icon: FlaskConical,
      label: 'Testing',
    },
    {
      path: '/sensors',
      icon: Wifi,
      label: 'Sensors',
    },
    {
      path: '/manual-entry',
      icon: Keyboard,
      label: 'Manual Entry',
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
    },
  ];

  return (
    <aside className="w-64 glass-card border-r border-sidebar-border flex-shrink-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="text-primary-foreground h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">SepsisGuard</h1>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => handleNavigation(item.path)}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="mr-3 h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant={item.badgeVariant} className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-sidebar-foreground">Theme</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">DR</span>
          </div>
          <div>
            <div className="font-medium text-sm text-sidebar-foreground">Dr. Sarah Chen</div>
            <div className="text-xs text-sidebar-foreground/70">Attending Physician</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
