import { useState } from 'react';
import { mockProducts, mockSuppliers } from '@/data/mockData';
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
import { PackagePlus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StockInForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    buyPrice: '',
    notes: '',
  });

  const selectedProduct = mockProducts.find((p) => p.id === formData.productId);
  const totalPrice = Number(formData.quantity) * Number(formData.buyPrice);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Barang Masuk Berhasil',
      description: `${formData.quantity} pcs ${selectedProduct?.name} telah ditambahkan ke stok.`,
    });
    setFormData({
      productId: '',
      supplierId: '',
      quantity: '',
      buyPrice: '',
      notes: '',
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <PackagePlus className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Input Barang Masuk</CardTitle>
            <CardDescription>Tambah stok produk baru ke gudang</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product">Produk *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) =>
                  setFormData({ ...formData, productId: value })
                }
              >
                <SelectTrigger id="product">
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

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplierId: value })
                }
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
              <Label htmlFor="buyPrice">Harga Beli / pcs *</Label>
              <Input
                id="buyPrice"
                type="number"
                min="0"
                placeholder="Masukkan harga"
                value={formData.buyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, buyPrice: e.target.value })
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
          {formData.quantity && formData.buyPrice && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Ringkasan</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah</span>
                  <span className="font-medium">{formData.quantity} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga per pcs</span>
                  <span className="font-medium">{formatCurrency(Number(formData.buyPrice))}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1 gradient-primary text-primary-foreground border-0">
              Simpan Barang Masuk
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
