import { fetchTopProducts } from "@/services/dashboard";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["hsl(160, 84%, 39%)", "hsl(180, 70%, 40%)", "hsl(200, 80%, 50%)", "hsl(38, 92%, 50%)", "hsl(280, 65%, 60%)"];

export function TopProductsChart() {
  const [data, setData] = useState<{ name: string; sold: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Produk Terlaris</h3>
        <p className="text-sm text-muted-foreground"> {data.length} produk dengan penjualan tertinggi</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip formatter={(value: number) => [`${value} pcs`, "Terjual"]} />
            <Bar dataKey="sold" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
