import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { StockFlowChart } from '@/components/dashboard/StockFlowChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { mockDashboardMetrics } from '@/data/mockData';
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
  const metrics = mockDashboardMetrics;

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Selamat datang kembali! Berikut ringkasan inventori Anda."
    >
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            trend={{ value: 12.5, isPositive: true }}
          />
          <MetricCard
            title="Nilai Aset"
            value={formatCurrency(metrics.totalAssetValue)}
            icon={<Wallet className="h-6 w-6" />}
            variant="success"
            trend={{ value: 8.3, isPositive: true }}
          />
          <MetricCard
            title="Stok Menipis"
            value={metrics.lowStockCount}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
