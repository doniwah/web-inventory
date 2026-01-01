import { supabase } from '@/lib/supabase';

export interface AverageSales {
  daily: { product: number; bundle: number };
  weekly: { product: number; bundle: number };
  monthly: { product: number; bundle: number };
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  totalAssetValue: number;
  lowStockCount: number;
  monthlyStockIn: number;
  monthlyStockOut: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  averageSales: AverageSales;
}

export interface TopProduct {
  name: string;
  sold: number;
}

export interface TopProductsData {
  products: TopProduct[];
  bundles: TopProduct[];
}

export interface StockFlow {
  month: string;
  masuk: number;
  keluar: number;
}

// Fetch dashboard metrics
export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    // Get total products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total stock and asset value
    const { data: products } = await supabase
      .from('products')
      .select('stok, harga_beli, harga_jual');

    const totalStock = products?.reduce((sum, p) => sum + p.stok, 0) ?? 0;
    const totalAssetValue = products?.reduce((sum, p) => sum + (p.stok * p.harga_beli), 0) ?? 0;

    // Get low stock count
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('id, stok, stok_minimum');

    const lowStockCount = lowStockProducts?.filter(p => p.stok <= p.stok_minimum).length ?? 0;

    // Get monthly stock in (current month)
    const startOfMonthDate = startOfMonth(new Date());

    const { data: stockInData } = await supabase
      .from('stock_in')
      .select('qty')
      .gte('tanggal', startOfMonthDate.toISOString());

    const monthlyStockIn = stockInData?.reduce((sum, item) => sum + item.qty, 0) ?? 0;

    // Get monthly stock out (current month)
    const { data: stockOutData } = await supabase
      .from('stock_out')
      .select('qty, total_harga, product_id, bundle_id')
      .gte('tanggal', startOfMonthDate.toISOString());

    const monthlyStockOut = stockOutData?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    const monthlyRevenue = stockOutData?.reduce((sum, item) => sum + (item.total_harga || 0), 0) ?? 0;

    // Calculate monthly profit (revenue - cost)
    // We already fetch bundle costs in Reports.tsx, let's do similar or handle nulls
    const { data: stockOutWithDetails } = await supabase
      .from('stock_out')
      .select(`
        qty,
        total_harga,
        product_id,
        bundle_id,
        products (harga_beli),
        bundles (
          bundle_items (
            qty, 
            products (harga_beli)
          )
        )
      `)
      .gte('tanggal', startOfMonthDate.toISOString());

    const monthlyCost = stockOutWithDetails?.reduce((sum, item: any) => {
      if (item.product_id && item.products) {
        return sum + (item.qty * (item.products.harga_beli || 0));
      } else if (item.bundle_id && item.bundles) {
        const bundleCost = item.bundles.bundle_items?.reduce((bSum: number, bi: any) => {
          return bSum + (bi.qty * (bi.products?.harga_beli || 0));
        }, 0) || 0;
        return sum + (item.qty * bundleCost);
      }
      return sum;
    }, 0) ?? 0;

    const monthlyProfit = monthlyRevenue - monthlyCost;

    // Calculate average sales (1 day, 7 days, 30 days) split by product/bundle
    const now = new Date();
    
    // Helper to calculate totals from data
    const getTotals = (data: any[] | null) => {
      return {
        product: data?.filter(i => i.product_id).reduce((sum, i) => sum + i.qty, 0) ?? 0,
        bundle: data?.filter(i => i.bundle_id).reduce((sum, i) => sum + i.qty, 0) ?? 0,
      };
    };

    // 1 day ago
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const { data: dailySales } = await supabase
      .from('stock_out')
      .select('qty, product_id, bundle_id')
      .gte('tanggal', oneDayAgo.toISOString());
    const dailyTotals = getTotals(dailySales);
    
    // 7 days ago
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: weeklySales } = await supabase
      .from('stock_out')
      .select('qty, product_id, bundle_id')
      .gte('tanggal', sevenDaysAgo.toISOString());
    const weeklyTotals = getTotals(weeklySales);
    
    // 30 days ago
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: monthlySales } = await supabase
      .from('stock_out')
      .select('qty, product_id, bundle_id')
      .gte('tanggal', thirtyDaysAgo.toISOString());
    const monthlyTotals = getTotals(monthlySales);

    return {
      totalProducts: totalProducts ?? 0,
      totalStock,
      totalAssetValue,
      lowStockCount,
      monthlyStockIn,
      monthlyStockOut,
      monthlyRevenue,
      monthlyProfit,
      averageSales: {
        daily: { product: Math.round(dailyTotals.product), bundle: Math.round(dailyTotals.bundle) },
        weekly: { product: Math.round(weeklyTotals.product / 7), bundle: Math.round(weeklyTotals.bundle / 7) },
        monthly: { product: Math.round(monthlyTotals.product / 30), bundle: Math.round(monthlyTotals.bundle / 30) },
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

// Fetch top products (most sold) split by product and bundle
export const fetchTopProducts = async (): Promise<TopProductsData> => {
  try {
    const { data, error } = await supabase
      .from('stock_out')
      .select(`
        qty,
        product_id,
        bundle_id,
        products (nama_produk),
        bundles (name)
      `);

    if (error) throw error;

    // Aggregate by product
    const productMap = new Map<string, number>();
    const bundleMap = new Map<string, number>();

    data?.forEach((item: any) => {
      if (item.product_id && item.products) {
        const name = item.products.nama_produk;
        productMap.set(name, (productMap.get(name) || 0) + item.qty);
      } else if (item.bundle_id && item.bundles) {
        const name = item.bundles.name;
        bundleMap.set(name, (bundleMap.get(name) || 0) + item.qty);
      }
    });

    const products = Array.from(productMap.entries())
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const bundles = Array.from(bundleMap.entries())
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return { products, bundles };
  } catch (error) {
    console.error('Error fetching top products:', error);
    return { products: [], bundles: [] };
  }
};

// Fetch stock flow per month (last 6 months)
export const fetchStockFlow = async (): Promise<StockFlow[]> => {
  try {
    const months = [];
    const now = new Date();

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('id-ID', { month: 'short' });
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      // Get stock in for this month
      const { data: stockIn } = await supabase
        .from('stock_in')
        .select('qty')
        .gte('tanggal', startOfMonth.toISOString())
        .lte('tanggal', endOfMonth.toISOString());

      const masuk = stockIn?.reduce((sum, item) => sum + item.qty, 0) ?? 0;

      // Get stock out for this month
      const { data: stockOut } = await supabase
        .from('stock_out')
        .select('qty')
        .gte('tanggal', startOfMonth.toISOString())
        .lte('tanggal', endOfMonth.toISOString());

      const keluar = stockOut?.reduce((sum, item) => sum + item.qty, 0) ?? 0;

      months.push({
        month: monthName,
        masuk,
        keluar,
      });
    }

    return months;
  } catch (error) {
    console.error('Error fetching stock flow:', error);
    return [];
  }
};
