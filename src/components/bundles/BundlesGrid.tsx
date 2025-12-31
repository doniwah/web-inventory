import { useState } from 'react';
import { mockBundles, mockProducts } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { 
  Search, 
  Plus, 
  Layers, 
  Package,
  AlertTriangle,
  Check,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BundlesGrid() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBundles = mockBundles.filter((bundle) =>
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductName = (productId: string) => {
    return mockProducts.find((p) => p.id === productId)?.name || '-';
  };

  const getProductStock = (productId: string) => {
    return mockProducts.find((p) => p.id === productId)?.stock || 0;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const checkBundleAvailability = (bundle: typeof mockBundles[0]) => {
    for (const item of bundle.items) {
      const stock = getProductStock(item.productId);
      if (stock < item.quantity) {
        return { available: false, missingItem: getProductName(item.productId) };
      }
    }
    return { available: true, missingItem: null };
  };

  const calculateMaxBundles = (bundle: typeof mockBundles[0]) => {
    let maxCount = Infinity;
    for (const item of bundle.items) {
      const stock = getProductStock(item.productId);
      const possible = Math.floor(stock / item.quantity);
      maxCount = Math.min(maxCount, possible);
    }
    return maxCount === Infinity ? 0 : maxCount;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari bundling..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:w-64"
          />
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow">
          <Plus className="h-4 w-4" />
          Buat Bundling
        </Button>
      </div>

      {/* Bundles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBundles.map((bundle, index) => {
          const { available, missingItem } = checkBundleAvailability(bundle);
          const maxBundles = calculateMaxBundles(bundle);

          return (
            <Card
              key={bundle.id}
              className={cn(
                'group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in',
                !available && 'border-destructive/30'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                      available ? 'gradient-primary' : 'bg-destructive/20'
                    )}>
                      <Layers className={cn(
                        'h-6 w-6',
                        available ? 'text-primary-foreground' : 'text-destructive'
                      )} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{bundle.name}</h3>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {bundle.category}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Isi Bundle ({bundle.items.length} item)
                  </p>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {bundle.items.map((item) => {
                      const stock = getProductStock(item.productId);
                      const hasStock = stock >= item.quantity;

                      return (
                        <div
                          key={item.productId}
                          className={cn(
                            'flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm',
                            !hasStock && 'bg-destructive/10'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Package className={cn(
                              'h-4 w-4',
                              hasStock ? 'text-muted-foreground' : 'text-destructive'
                            )} />
                            <span className={cn(
                              hasStock ? 'text-foreground' : 'text-destructive'
                            )}>
                              {getProductName(item.productId)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">×{item.quantity}</span>
                            {hasStock ? (
                              <Check className="h-4 w-4 text-success" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price & Availability */}
                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Harga Jual</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(bundle.sellPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Bisa Dibuat</p>
                    <p className={cn(
                      'text-xl font-bold',
                      maxBundles > 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {maxBundles} pcs
                    </p>
                  </div>
                </div>

                {!available && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Stok {missingItem} tidak mencukupi</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
