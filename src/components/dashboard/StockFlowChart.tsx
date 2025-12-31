import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockChartData } from '@/data/mockData';

export function StockFlowChart() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Arus Stok</h3>
        <p className="text-sm text-muted-foreground">Perbandingan barang masuk & keluar</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockChartData.stockFlow}>
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
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 13%, 90%)' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(220, 10%, 46%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(220, 13%, 90%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 90%)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="masuk"
              name="Barang Masuk"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMasuk)"
            />
            <Area
              type="monotone"
              dataKey="keluar"
              name="Barang Keluar"
              stroke="hsl(200, 80%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorKeluar)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
