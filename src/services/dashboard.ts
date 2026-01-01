import { supabase } from '@/lib/supabase';

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  totalAssetValue: number;
  lowStockCount: number;
  monthlyStockIn: number;
  monthlyStockOut: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  averageSales: {
    daily: number;      // 1 hari terakhir
    weekly: number;     // rata-rata per hari dalam 7 hari terakhir
    monthly: number;    // rata-rata per hari dalam 30 hari terakhir
  };
}

export interface TopProduct {
  name: string;
  sold: number;
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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: stockInData } = await supabase
      .from('stock_in')
      .select('qty')
      .gte('tanggal', startOfMonth.toISOString());

    const monthlyStockIn = stockInData?.reduce((sum, item) => sum + item.qty, 0) ?? 0;

    // Get monthly stock out (current month)
    const { data: stockOutData } = await supabase
      .from('stock_out')
      .select('qty, total_harga')
      .gte('tanggal', startOfMonth.toISOString());

    const monthlyStockOut = stockOutData?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    const monthlyRevenue = stockOutData?.reduce((sum, item) => sum + (item.total_harga || 0), 0) ?? 0;

    // Calculate monthly profit (revenue - cost)
    const { data: stockOutWithCost } = await supabase
      .from('stock_out')
      .select(`
        qty,
        total_harga,
        product_id,
        products!inner(harga_beli)
      `)
      .gte('tanggal', startOfMonth.toISOString())
      .not('product_id', 'is', null);

    const monthlyCost = stockOutWithCost?.reduce((sum, item: any) => {
      const cost = item.qty * (item.products?.harga_beli || 0);
      return sum + cost;
    }, 0) ?? 0;

    const monthlyProfit = monthlyRevenue - monthlyCost;

    // Calculate average sales (1 day, 7 days, 30 days)
    const now = new Date();
    
    // 1 day ago
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: dailySales } = await supabase
      .from('stock_out')
      .select('qty')
      .gte('tanggal', oneDayAgo.toISOString());
    
    const dailyTotal = dailySales?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    
    // 7 days ago
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: weeklySales } = await supabase
      .from('stock_out')
      .select('qty')
      .gte('tanggal', sevenDaysAgo.toISOString());
    
    const weeklyTotal = weeklySales?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    const weeklyAverage = weeklyTotal / 7;
    
    // 30 days ago
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: monthlySales } = await supabase
      .from('stock_out')
      .select('qty')
      .gte('tanggal', thirtyDaysAgo.toISOString());
    
    const monthlyTotal = monthlySales?.reduce((sum, item) => sum + item.qty, 0) ?? 0;
    const monthlyAverage = monthlyTotal / 30;

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
        daily: Math.round(dailyTotal),
        weekly: Math.round(weeklyAverage),
        monthly: Math.round(monthlyAverage),
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

// Fetch top products (most sold)
export const fetchTopProducts = async (): Promise<TopProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_out')
      .select(`
        qty,
        products!inner(nama_produk)
      `)
      .not('product_id', 'is', null);

    if (error) throw error;

    // Aggregate by product
    const productMap = new Map<string, number>();
    data?.forEach((item: any) => {
      const productName = item.products?.nama_produk;
      if (productName) {
        productMap.set(productName, (productMap.get(productName) || 0) + item.qty);
      }
    });

    // Convert to array and sort
    const topProducts = Array.from(productMap.entries())
      .map(([name, sold]) => ({ name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return topProducts;
  } catch (error) {
    console.error('Error fetching top products:', error);
    return [];
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
