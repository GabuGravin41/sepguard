import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export default function StatTile({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  iconColor = 'text-primary'
}: StatTileProps) {
  const changeColors = {
    positive: 'text-primary',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className="glass-card hover-lift" data-testid={`stat-tile-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
            {change && (
              <p className={`text-xs mt-1 ${changeColors[changeType]}`}>
                <span data-testid={`stat-change-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {change}
                </span>
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconColor.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} h-6 w-6`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
