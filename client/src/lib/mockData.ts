// This file contains utilities for generating mock data for the SepsisGuard dashboard
// Note: This is for UI development only - real implementation should use actual medical data APIs

export function generateVitalsTimeSeries(hours: number = 24) {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: timestamp.toISOString(),
      heartRate: 70 + Math.random() * 40 + Math.sin(i * 0.5) * 10,
      temperature: 98.6 + Math.random() * 3 + Math.sin(i * 0.3) * 1,
      systolicBP: 120 + Math.random() * 40 + Math.sin(i * 0.2) * 15,
      diastolicBP: 80 + Math.random() * 20 + Math.sin(i * 0.2) * 10,
      oxygenSat: 95 + Math.random() * 5,
      respiratoryRate: 16 + Math.random() * 8,
      riskScore: Math.max(0, Math.min(100, 30 + Math.random() * 40 + Math.sin(i * 0.1) * 20)),
    });
  }
  
  return data;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'text-destructive';
  if (score >= 60) return 'text-amber-600';
  return 'text-primary';
}

export function getRiskScoreBadge(score: number): string {
  if (score >= 80) return 'bg-destructive/10 text-destructive';
  if (score >= 60) return 'bg-amber-500/10 text-amber-600';
  return 'bg-primary/10 text-primary';
}

export function getStatusIndicator(status: string): string {
  switch (status) {
    case 'critical': return 'status-critical';
    case 'warning': return 'status-warning';
    case 'stable': return 'status-stable';
    default: return 'status-offline';
  }
}

export function formatVitalValue(value: number | string | null, unit: string): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value} ${unit}`;
}

export function calculateTimeUntilNext(nextRun: Date | string): string {
  const now = new Date();
  const nextRunDate = new Date(nextRun);
  const diffInMinutes = Math.floor((nextRunDate.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffInMinutes <= 0) return 'Overdue';
  if (diffInMinutes < 60) return `in ${diffInMinutes} min`;
  
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  return `in ${hours}h ${minutes}m`;
}

export function getProgressPercentage(lastRun: Date | string, nextRun: Date | string): number {
  const now = new Date();
  const lastRunDate = new Date(lastRun);
  const nextRunDate = new Date(nextRun);
  const totalDuration = nextRunDate.getTime() - lastRunDate.getTime();
  const elapsed = now.getTime() - lastRunDate.getTime();
  
  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
}
