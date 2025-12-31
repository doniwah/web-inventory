import { useState } from 'react';
import { mockProducts, mockBundles } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PackageMinus, Calculator, Layers, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StockOutForm() {
  const { toast } = useToast();
  const [type, setType] = useState<'product' | 'bundle'>('product');
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    sellPrice: '',
    additionalCost: '',
    notes: '',
  });

  const selectedProduct = mockProducts.find((p) => p.id === formData.itemId);
  const selectedBundle = mockBundles.find((b) => b.id === formData.itemId);
  
  const sellPrice = type === 'product' 
    ? (selectedProduct?.sellPrice || 0) 
    : (selectedBundle?.sellPrice || 0);
  
  const totalPrice = Number(formData.quantity) * sellPrice;
  const additionalCost = Number(formData.additionalCost) || 0;
  const finalTotal = totalPrice - additionalCost;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemName = type === 'product' ? selectedProduct?.name : selectedBundle?.name;
    toast({
      title: 'Barang Keluar Berhasil',
      description: `${formData.quantity} pcs ${itemName} telah dicatat keluar.`,
    });
    setFormData({
      itemId: '',
      quantity: '',
      sellPrice: '',
      additionalCost: '',
      notes: '',
    });
  };

  const getProductName = (productId: string) => {
    return mockProducts.find((p) => p.id === productId)?.name || '-';
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2">
            <PackageMinus className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Input Barang Keluar</CardTitle>
            <CardDescription>Catat penjualan atau distribusi barang</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={type} onValueChange={(v) => {
          setType(v as 'product' | 'bundle');
          setFormData({ ...formData, itemId: '' });
        }}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="product" className="gap-2">
              <Package className="h-4 w-4" />
              Produk Satuan
            </TabsTrigger>
            <TabsTrigger value="bundle" className="gap-2">
              <Layers className="h-4 w-4" />
              Bundling
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TabsContent value="product" className="mt-0">
              <div className="space-y-2">
                <Label>Pilih Produk *</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stok: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="bundle" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Pilih Bundling *</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bundling" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBundles.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name} - {formatCurrency(bundle.sellPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBundle && (
                <div className="rounded-lg border bg-secondary/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Isi Bundle
                  </p>
                  <div className="space-y-1">
                    {selectedBundle.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{getProductName(item.productId)}</span>
                        <span className="text-muted-foreground">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Masukkan jumlah"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalCost">Biaya Tambahan</Label>
                <Input
                  id="additionalCost"
                  type="number"
                  min="0"
                  placeholder="Opsional"
                  value={formData.additionalCost}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalCost: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan (opsional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            {/* Calculation Summary */}
            {formData.quantity && formData.itemId && (
              <div className="rounded-xl border border-chart-2/20 bg-chart-2/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-chart-2" />
                  <span className="font-medium text-foreground">Ringkasan</span>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah</span>
                    <span className="font-medium">{formData.quantity} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga per pcs</span>
                    <span className="font-medium">{formatCurrency(sellPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  {additionalCost > 0 && (
                    <div className="flex justify-between text-warning">
                      <span>Biaya Tambahan</span>
                      <span>-{formatCurrency(additionalCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold text-chart-2">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1">
                Batal
              </Button>
              <Button type="submit" className="flex-1 bg-chart-2 hover:bg-chart-2/90 text-primary-foreground border-0">
                Simpan Barang Keluar
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
