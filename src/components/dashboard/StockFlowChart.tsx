import { fetchStockFlow } from "@/services/dashboard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function StockFlowChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    // Real-time subscription
    const stockInChannel = supabase
      .channel('stock-flow-in')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_in' }, () => {
        loadData();
      })
      .subscribe();

    const stockOutChannel = supabase
      .channel('stock-flow-out')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_out' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stockInChannel);
      supabase.removeChannel(stockOutChannel);
    };
  }, []);

  const loadData = async () => {
    try {
      const flowData = await fetchStockFlow();
      setData(flowData);
    } catch (error) {
      console.error('Error loading stock flow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Arus Stok</h3>
        <p className="text-sm text-muted-foreground">Perbandingan barang masuk & keluar</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorMasuk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorKeluar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(200, 80%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Area type="monotone" dataKey="masuk" name="Barang Masuk" stroke="hsl(160, 84%, 39%)" fill="url(#colorMasuk)" />
            <Area type="monotone" dataKey="keluar" name="Barang Keluar" stroke="hsl(200, 80%, 50%)" fill="url(#colorKeluar)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
