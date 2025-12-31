import { MetricCard } from "@/components/dashboard/MetricCard";
import { supabase } from "@/lib/supabase";
import { ArrowDown, Boxes, Package } from "lucide-react";
import { useEffect, useState } from "react";

export function DashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProduk: 0,
    totalStok: 0,
    barangMasuk: 0,
    trendMasuk: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });

      const { data: stokData } = await supabase.from("products").select("stok");

      const totalStok = stokData?.reduce((sum, p) => sum + p.stok, 0) ?? 0;

      setMetrics({
        totalProduk: count ?? 0,
        totalStok,
        barangMasuk: 120, // contoh dulu
        trendMasuk: 12.5,
      });

      setLoading(false);
    };

    fetchMetrics();
  }, []);

  if (loading) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard title="Total Produk" value={metrics.totalProduk} icon={<Package />} />

      <MetricCard title="Total Stok" value={metrics.totalStok} icon={<Boxes />} variant="success" />

      <MetricCard
        title="Barang Masuk"
        value={metrics.barangMasuk}
        icon={<ArrowDown />}
        trend={{
          value: Math.abs(metrics.trendMasuk),
          isPositive: metrics.trendMasuk >= 0,
        }}
        variant="primary"
      />
    </div>
  );
}
