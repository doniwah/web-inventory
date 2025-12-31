import { AlertTriangle } from 'lucide-react';
import { mockProducts } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function LowStockAlert() {
  const lowStockProducts = mockProducts.filter((p) => p.stock <= p.minStock);

  if (lowStockProducts.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Stok Menipis</h3>
          <p className="text-sm text-muted-foreground">{lowStockProducts.length} produk perlu restok</p>
        </div>
      </div>
      <div className="space-y-3">
        {lowStockProducts.map((product) => {
          const percentage = (product.stock / product.minStock) * 100;
          const isKritis = product.stock < product.minStock;
          
          return (
            <div
              key={product.id}
              className="rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-foreground">{product.name}</span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isKritis ? 'text-destructive' : 'text-warning'
                  )}
                >
                  {product.stock} / {product.minStock} pcs
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isKritis ? 'bg-destructive' : 'bg-warning'
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
