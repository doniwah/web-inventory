import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Clock, DollarSign, Layers, PackageMinus, PackagePlus, Settings } from "lucide-react";
import { useEffect, useState } from "react";

type ActivityLog = {
  id: number;
  aktivitas: string;
  created_at: string;
  users:
    | {
        name: string;
      }[]
    | null;
};

const iconMap = {
  stock_in: { icon: PackagePlus, color: "text-success bg-success/10" },
  stock_out: { icon: PackageMinus, color: "text-chart-2 bg-chart-2/10" },
  adjustment: { icon: Settings, color: "text-warning bg-warning/10" },
  price_change: { icon: DollarSign, color: "text-chart-4 bg-chart-4/10" },
  bundle_create: { icon: Layers, color: "text-chart-5 bg-chart-5/10" },
};

function detectType(aktivitas: string): keyof typeof iconMap {
  const text = aktivitas.toLowerCase();
  if (text.includes("masuk")) return "stock_in";
  if (text.includes("keluar")) return "stock_out";
  if (text.includes("penyesuaian")) return "adjustment";
  if (text.includes("harga")) return "price_change";
  if (text.includes("bundle")) return "bundle_create";
  return "adjustment";
}

export function RecentActivity() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          `
          id,
          aktivitas,
          created_at,
          users ( name )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Failed fetch activity logs:", error);
      } else {
        setLogs(data ?? []);
      }

      setLoading(false);
    };

    fetchLogs();
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h3>
          <p className="text-sm text-muted-foreground">Log aktivitas sistem</p>
        </div>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat aktivitas...</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = iconMap[detectType(log.aktivitas)];
            const Icon = config.icon;

            return (
              <div key={log.id} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{log.aktivitas}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{log.users?.[0]?.name ?? "System"}</span>
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
