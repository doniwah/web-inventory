import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { StockFlowChart } from '@/components/dashboard/StockFlowChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { fetchDashboardMetrics, DashboardMetrics } from '@/services/dashboard';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  Boxes, 
  Wallet, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Index = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();

    // Set up real-time subscriptions for auto-update
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadMetrics();
      })
      .subscribe();

    const stockInChannel = supabase
      .channel('stock-in-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_in' }, () => {
        loadMetrics();
      })
      .subscribe();

    const stockOutChannel = supabase
      .channel('stock-out-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_out' }, () => {
        loadMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(stockInChannel);
      supabase.removeChannel(stockOutChannel);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Dashboard" subtitle="Memuat data...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  if (!metrics) {
    return (
      <MainLayout title="Dashboard" subtitle="Error loading data">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Gagal memuat data dashboard</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Berikut ringkasan inventori Anda."
    >
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Produk"
            value={metrics.totalProducts}
            icon={<Package className="h-6 w-6" />}
            variant="primary"
          />
          <MetricCard
            title="Total Stok"
            value={`${metrics.totalStock.toLocaleString()} pcs`}
            icon={<Boxes className="h-6 w-6" />}
          />
          <MetricCard
            title="Nilai Aset"
            value={formatCurrency(metrics.totalAssetValue)}
            icon={<Wallet className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Stok Menipis"
            value={metrics.lowStockCount}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Barang Masuk</p>
                <p className="text-2xl font-bold text-foreground">{metrics.monthlyStockIn}</p>
                <p className="text-xs text-muted-foreground">bulan ini</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Barang Keluar</p>
                <p className="text-2xl font-bold text-foreground">{metrics.monthlyStockOut}</p>
                <p className="text-xs text-muted-foreground">bulan ini</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <TrendingDown className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendapatan</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.monthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground">bulan ini</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                <Wallet className="h-5 w-5 text-chart-4" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Keuntungan</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(metrics.monthlyProfit)}</p>
                <p className="text-xs text-muted-foreground">bulan ini</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Average Sales Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Terjual</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageSales.daily} pcs</p>
                <p className="text-xs text-muted-foreground">1 hari terakhir</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Terjual</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageSales.weekly} pcs/hari</p>
                <p className="text-xs text-muted-foreground">7 hari terakhir</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <TrendingUp className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Terjual</p>
                <p className="text-2xl font-bold text-foreground">{metrics.averageSales.monthly} pcs/hari</p>
                <p className="text-xs text-muted-foreground">30 hari terakhir</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                <TrendingUp className="h-5 w-5 text-chart-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StockFlowChart />
          <TopProductsChart />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <LowStockAlert />
          <RecentActivity />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
