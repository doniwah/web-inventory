import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Clock, DollarSign, Layers, PackageMinus, PackagePlus, Settings, Package } from "lucide-react";
import { useEffect, useState } from "react";

type ActivityLog = {
  id: number;
  type: string;
  aktivitas: string;
  created_at: string;
  user_id: string | null;
  user_name: string;
};

const iconMap = {
  stock_in: { icon: PackagePlus, color: "text-success bg-success/10" },
  stock_out: { icon: PackageMinus, color: "text-chart-2 bg-chart-2/10" },
  adjustment: { icon: Settings, color: "text-warning bg-warning/10" },
  price_change: { icon: DollarSign, color: "text-chart-4 bg-chart-4/10" },
  bundle_create: { icon: Layers, color: "text-chart-5 bg-chart-5/10" },
  product_create: { icon: Package, color: "text-primary bg-primary/10" },
};

export function RecentActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('recent-activity')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async () => {
    try {
      // First try with user join
      let { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          type,
          aktivitas,
          created_at,
          user_id,
          users!user_id (name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      // If join fails, fetch without join and get users separately
      if (error) {
        console.log('Trying without user join...', error);
        const result = await supabase
          .from("activity_logs")
          .select('id, type, aktivitas, created_at, user_id')
          .order("created_at", { ascending: false })
          .limit(5);
        
        data = result.data;
        error = result.error;

        // Fetch user names separately if we have user_ids
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((item: any) => item.user_id).filter(Boolean))];
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, name')
              .in('id', userIds);

            // Map user names to activities
            if (usersData) {
              const userMap = new Map(usersData.map((u: any) => [u.id, u.name]));
              data = data.map((item: any) => ({
                ...item,
                users: item.user_id ? { name: userMap.get(item.user_id) } : null
              }));
            }
          }
        }
      }

      if (error) {
        console.error("Failed to fetch activity logs:", error);
        setLogs([]);
      } else {
        const activities: ActivityLog[] = (data || []).map((item: any) => ({
          id: item.id,
          type: item.type || 'adjustment',
          aktivitas: item.aktivitas || 'No description',
          created_at: item.created_at,
          user_id: item.user_id,
          user_name: item.users?.name || 'System',
        }));
        setLogs(activities);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground">5 aktivitas terakhir</p>
        </div>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat aktivitas...</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = iconMap[log.type as keyof typeof iconMap] || iconMap.adjustment;
            const Icon = config.icon;

            return (
              <div key={log.id} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{log.aktivitas}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{log.user_name}</span>
                    <span>•</span>
                    <span>{format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: id })}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>}
        </div>
      )}
    </div>
  );
}
