import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateVitalsTimeSeries } from "@/lib/mockData";
import { useState } from "react";

interface VitalsChartProps {
  patientId?: string;
  title?: string;
  height?: number;
}

export default function VitalsChart({ patientId, title = "Vitals Trend", height = 300 }: VitalsChartProps) {
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  
  // Generate mock data - in real implementation, this would fetch from API
  const data = generateVitalsTimeSeries(timeRange).map(point => ({
    time: new Date(point.time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    heartRate: Math.round(point.heartRate),
    temperature: Number(point.temperature.toFixed(1)),
    systolicBP: Math.round(point.systolicBP),
    oxygenSat: Math.round(point.oxygenSat),
    riskScore: Math.round(point.riskScore),
  }));

  const timeRangeButtons = [
    { value: 6 as const, label: '6h' },
    { value: 12 as const, label: '12h' },
    { value: 24 as const, label: '24h' },
  ];

  return (
    <Card className="glass-card" data-testid={`vitals-chart-${patientId || 'general'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {title}
          </CardTitle>
          <div className="flex space-x-2">
            {timeRangeButtons.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={timeRange === value ? "default" : "outline"}
                onClick={() => setTimeRange(value)}
                data-testid={`button-timerange-${value}h`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--card-foreground))',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                name="Heart Rate (bpm)"
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={false}
                name="Temperature (°F)"
              />
              <Line
                type="monotone"
                dataKey="systolicBP"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                name="Systolic BP (mmHg)"
              />
              <Line
                type="monotone"
                dataKey="oxygenSat"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="O2 Saturation (%)"
              />
              <Line
                type="monotone"
                dataKey="riskScore"
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                dot={false}
                name="Risk Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
