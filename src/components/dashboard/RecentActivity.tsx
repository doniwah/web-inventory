import { mockActivityLogs } from '@/data/mockData';
import { 
  PackagePlus, 
  PackageMinus, 
  Settings, 
  DollarSign, 
  Layers,
  Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const iconMap = {
  stock_in: { icon: PackagePlus, color: 'text-success bg-success/10' },
  stock_out: { icon: PackageMinus, color: 'text-chart-2 bg-chart-2/10' },
  adjustment: { icon: Settings, color: 'text-warning bg-warning/10' },
  price_change: { icon: DollarSign, color: 'text-chart-4 bg-chart-4/10' },
  product_create: { icon: PackagePlus, color: 'text-primary bg-primary/10' },
  bundle_create: { icon: Layers, color: 'text-chart-5 bg-chart-5/10' },
};

export function RecentActivity() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground">Log aktivitas sistem</p>
        </div>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-4">
        {mockActivityLogs.slice(0, 5).map((log, index) => {
          const { icon: Icon, color } = iconMap[log.type];
          
          return (
            <div
              key={log.id}
              className={cn(
                'flex items-start gap-3 animate-slide-up',
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{log.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{log.userName}</span>
                  <span>•</span>
                  <span>{format(log.timestamp, 'dd MMM yyyy, HH:mm', { locale: id })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
