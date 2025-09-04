import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Heart, Thermometer, Gauge, Wind } from "lucide-react";
import { type Sensor } from "@shared/schema";
import { formatTimeAgo } from "@/lib/mockData";

export default function Sensors() {
  const { data: sensors } = useQuery({
    queryKey: ['/api/sensors'],
    refetchInterval: 30000,
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Group sensors by type and calculate stats
  const sensorStats = sensors?.reduce((acc, sensor) => {
    acc[sensor.sensorType] = acc[sensor.sensorType] || { online: 0, offline: 0, error: 0, total: 0 };
    acc[sensor.sensorType].total++;
    acc[sensor.sensorType][sensor.status as keyof typeof acc[typeof sensor.sensorType]]++;
    return acc;
  }, {} as Record<string, { online: number; offline: number; error: number; total: number }>) || {};

  // Group sensors by patient for detailed view
  const sensorsByPatient = sensors?.reduce((acc, sensor) => {
    if (!acc[sensor.patientId]) {
      acc[sensor.patientId] = [];
    }
    acc[sensor.patientId].push(sensor);
    return acc;
  }, {} as Record<string, Sensor[]>) || {};

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'heart_rate':
        return Heart;
      case 'temperature':
        return Thermometer;
      case 'blood_pressure':
        return Gauge;
      case 'oxygen':
        return Wind;
      default:
        return Activity;
    }
  };

  const getSensorLabel = (type: string) => {
    switch (type) {
      case 'heart_rate':
        return 'Heart Rate Monitors';
      case 'temperature':
        return 'Temperature Sensors';
      case 'blood_pressure':
        return 'Blood Pressure';
      case 'oxygen':
        return 'Oxygen Monitors';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-primary text-primary-foreground';
      case 'offline':
        return 'bg-muted text-muted-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'online':
        return 'status-stable';
      case 'offline':
        return 'status-offline';
      case 'error':
        return 'status-warning';
      default:
        return 'status-offline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sensor Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(sensorStats).map(([type, stats]) => {
          const Icon = getSensorIcon(type);
          const onlinePercentage = (stats.online / stats.total) * 100;
          
          return (
            <Card key={type} className="glass-card text-center" data-testid={`sensor-overview-${type}`}>
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Icon className="text-primary h-8 w-8" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  {getSensorLabel(type)}
                </h4>
                <div className="text-3xl font-bold text-primary mb-1" data-testid={`sensor-count-${type}`}>
                  {stats.online}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  of {stats.total} online
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${onlinePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(onlinePercentage)}% operational
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sensor Status Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <span className="status-indicator status-stable mr-2"></span>
                <span className="text-sm font-medium text-foreground">Online</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {Object.values(sensorStats).reduce((sum, stats) => sum + stats.online, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Sensors operational</p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <span className="status-indicator status-offline mr-2"></span>
                <span className="text-sm font-medium text-foreground">Offline</span>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">
                {Object.values(sensorStats).reduce((sum, stats) => sum + stats.offline, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Sensors offline</p>
            </div>

            <div className="text-center p-4 bg-amber-500/10 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <span className="status-indicator status-warning mr-2"></span>
                <span className="text-sm font-medium text-foreground">Errors</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {Object.values(sensorStats).reduce((sum, stats) => sum + stats.error, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Sensors with errors</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Sensor Status Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Sensor Details by Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="sensor-details-table">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Room</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Heart Rate</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Temperature</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Blood Pressure</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Oxygen</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Last Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patients?.map((patient) => {
                  const patientSensors = sensorsByPatient[patient.id] || [];
                  const sensorsByType = patientSensors.reduce((acc, sensor) => {
                    acc[sensor.sensorType] = sensor;
                    return acc;
                  }, {} as Record<string, Sensor>);

                  const lastUpdate = patientSensors.reduce((latest, sensor) => {
                    return sensor.lastUpdate > latest ? sensor.lastUpdate : latest;
                  }, new Date(0));

                  return (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-secondary/30 transition-colors"
                      data-testid={`sensor-row-${patient.id}`}
                    >
                      <td className="p-4 font-medium">{patient.room}</td>
                      <td className="p-4">{patient.name}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`status-indicator ${getStatusIndicator(sensorsByType.heart_rate?.status || 'offline')}`}></span>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(sensorsByType.heart_rate?.status || 'offline')}
                          >
                            {sensorsByType.heart_rate?.status || 'offline'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`status-indicator ${getStatusIndicator(sensorsByType.temperature?.status || 'offline')}`}></span>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(sensorsByType.temperature?.status || 'offline')}
                          >
                            {sensorsByType.temperature?.status || 'offline'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`status-indicator ${getStatusIndicator(sensorsByType.blood_pressure?.status || 'offline')}`}></span>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(sensorsByType.blood_pressure?.status || 'offline')}
                          >
                            {sensorsByType.blood_pressure?.status || 'offline'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`status-indicator ${getStatusIndicator(sensorsByType.oxygen?.status || 'offline')}`}></span>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(sensorsByType.oxygen?.status || 'offline')}
                          >
                            {sensorsByType.oxygen?.status || 'offline'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {lastUpdate.getTime() > 0 ? formatTimeAgo(lastUpdate) : 'Never'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
