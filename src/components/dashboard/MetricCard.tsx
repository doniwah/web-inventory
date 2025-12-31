import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'warning' | 'success';
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
    success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
  };

  const iconStyles = {
    default: 'bg-secondary text-foreground',
    primary: 'bg-primary/20 text-primary',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value}%
              </span>
              <span className="text-sm text-muted-foreground">vs bulan lalu</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110',
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
