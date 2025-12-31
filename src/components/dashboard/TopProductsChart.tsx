import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { mockChartData } from '@/data/mockData';

const COLORS = [
  'hsl(160, 84%, 39%)',
  'hsl(180, 70%, 40%)',
  'hsl(200, 80%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
];

export function TopProductsChart() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Produk Terlaris</h3>
        <p className="text-sm text-muted-foreground">5 produk dengan penjualan tertinggi</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockChartData.topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" horizontal={false} />
            <XAxis 
              type="number"
              tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 13%, 90%)' }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 13%, 90%)' }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [`${value} pcs`, 'Terjual']}
            />
            <Bar 
              dataKey="sold" 
              radius={[0, 4, 4, 0]}
            >
              {mockChartData.topProducts.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
