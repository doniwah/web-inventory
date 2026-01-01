import { fetchTopProducts, TopProductsData } from "@/services/dashboard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(160, 84%, 39%)", "hsl(180, 70%, 40%)", "hsl(200, 80%, 50%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)"];

export function TopProductsChart() {
  const [data, setData] = useState<TopProductsData>({ products: [], bundles: [] });
  const [category, setCategory] = useState<"products" | "bundles">("products");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Real-time subscription
    const channel = supabase
      .channel('top-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_out' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const productsData = await fetchTopProducts();
      setData(productsData);
    } catch (error) {
      console.error('Error loading top products:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = category === "products" ? data.products : data.bundles;

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Produk Terlaris</h3>
          <p className="text-sm text-muted-foreground"> {chartData.length} item dengan penjualan tertinggi</p>
        </div>
        
        <Tabs value={category} onValueChange={(v: any) => setCategory(v)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Satuan</TabsTrigger>
            <TabsTrigger value="bundles">Bundling</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={100} />
            <Tooltip 
              formatter={(value: number) => [`${value} pcs`, "Terjual"]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="sold" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
