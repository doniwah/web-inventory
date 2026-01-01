import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
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

type Product = {
  id: number;
  nama_produk: string;
  stok: number;
  harga_jual: number;
  box_per_dus?: number;
  pcs_per_box?: number;
};

type Bundle = {
  id: number;
  name: string;
  harga_jual: number;
  bundle_items: {
    product_id: number;
    qty: number;
    products: {
      nama_produk: string;
      stok: number;
    };
  }[];
};

export function StockOutForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'product' | 'bundle'>('product');
  
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    unit: 'pcs',
    additionalCost: '',
    notes: '',
  });

  const selectedProduct = products.find((p) => p.id === parseInt(formData.itemId));
  const selectedBundle = bundles.find((b) => b.id === parseInt(formData.itemId));
  
  const sellPrice = type === 'product' 
    ? (selectedProduct?.harga_jual || 0) 
    : (selectedBundle?.harga_jual || 0);
  
  const totalPrice = Number(formData.quantity) * sellPrice;
  const additionalCost = Number(formData.additionalCost) || 0;
  const finalTotal = totalPrice - additionalCost;

  const [totalPcs, setTotalPcs] = useState(0);

  useEffect(() => {
    if (type === 'product' && selectedProduct && formData.quantity) {
      const qty = parseInt(formData.quantity) || 0;
      let calculatedPcs = qty;

      if (formData.unit === 'dus') {
        calculatedPcs = qty * (selectedProduct.box_per_dus || 1) * (selectedProduct.pcs_per_box || 1);
      } else if (formData.unit === 'box') {
        calculatedPcs = qty * (selectedProduct.pcs_per_box || 1);
      }

      setTotalPcs(calculatedPcs);
    } else if (type === 'bundle' && formData.quantity) {
      setTotalPcs(parseInt(formData.quantity) || 0);
    } else {
      setTotalPcs(0);
    }
  }, [formData.quantity, formData.unit, selectedProduct, type]);

  useEffect(() => {
    fetchProducts();
    fetchBundles();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, nama_produk, stok, harga_jual, box_per_dus, pcs_per_box')
      .order('nama_produk');
    setProducts(data || []);
    setLoading(false);
  };

  const fetchBundles = async () => {
    const { data } = await supabase
      .from('bundles')
      .select(`
        id,
        name,
        harga_jual,
        bundle_items (
          product_id,
          qty,
          products (
            nama_produk,
            stok
          )
        )
      `)
      .order('name');
    setBundles(data || []);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.itemId || !formData.quantity) {
      toast({
        title: 'Error',
        description: 'Item dan jumlah wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const quantity = parseInt(formData.quantity);

      if (type === 'product') {
        // Handle product stock out
        const productId = parseInt(formData.itemId);
        
        // Check stock availability
        const { data: currentProduct, error: fetchError } = await supabase
          .from('products')
          .select('stok')
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        if (currentProduct.stok < totalPcs) {
          toast({
            title: 'Error',
            description: `Stok tidak mencukupi. Stok tersedia: ${currentProduct.stok} pcs`,
            variant: 'destructive',
          });
          setSubmitting(false);
          return;
        }

        // Update stock
        const newStock = currentProduct.stok - totalPcs;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stok: newStock })
          .eq('id', productId);

        if (updateError) throw updateError;

        // Insert transaction
        const { error: transactionError } = await supabase
          .from('stock_out')
          .insert([
            {
              product_id: productId,
              bundle_id: null,
              qty: totalPcs,
              unit_transaksi: formData.unit,
              qty_transaksi: quantity,
              harga_jual: sellPrice,
              biaya_tambahan: additionalCost,
              total_harga: finalTotal,
              keterangan: formData.notes || null,
              tanggal: new Date().toISOString(),
            },
          ]);

        if (transactionError) throw transactionError;

        // Log activity
        await logActivity(
          'stock_out',
          `${formData.quantity} ${formData.unit} (${totalPcs} pcs) ${selectedProduct?.nama_produk} keluar`,
          user?.id ? user.id : undefined
        );

        toast({
          title: 'Barang Keluar Berhasil',
          description: `${formData.quantity} ${formData.unit} ${selectedProduct?.nama_produk} telah dicatat keluar.`,
        });
      } else {
        // Handle bundle stock out
        const bundleId = parseInt(formData.itemId);
        
        if (!selectedBundle) throw new Error('Bundle not found');

        // Check if all items in bundle have enough stock
        for (const item of selectedBundle.bundle_items) {
          const requiredQty = item.qty * quantity;
          if (item.products.stok < requiredQty) {
            toast({
              title: 'Error',
              description: `Stok ${item.products.nama_produk} tidak mencukupi. Dibutuhkan: ${requiredQty}, Tersedia: ${item.products.stok}`,
              variant: 'destructive',
            });
            setSubmitting(false);
            return;
          }
        }

        // Update stock for all items in bundle
        for (const item of selectedBundle.bundle_items) {
          const requiredQty = item.qty * quantity;
          const { data: currentProduct, error: fetchError } = await supabase
            .from('products')
            .select('stok')
            .eq('id', item.product_id)
            .single();

          if (fetchError) throw fetchError;

          const newStock = currentProduct.stok - requiredQty;
          const { error: updateError } = await supabase
            .from('products')
            .update({ stok: newStock })
            .eq('id', item.product_id);

          if (updateError) throw updateError;
        }

        // Insert transaction
        const { error: transactionError } = await supabase
          .from('stock_out')
          .insert([
            {
              product_id: null,
              bundle_id: bundleId,
              qty: quantity,
              harga_jual: sellPrice,
              biaya_tambahan: additionalCost,
              total_harga: finalTotal,
              keterangan: formData.notes || null,
              tanggal: new Date().toISOString(),
            },
          ]);

        if (transactionError) throw transactionError;

        // Log activity
        await logActivity(
          'stock_out',
          `${quantity} pcs bundle ${selectedBundle?.name} keluar`,
          user?.id ? user.id : undefined
        );

        toast({
          title: 'Barang Keluar Berhasil',
          description: `${quantity} pcs ${selectedBundle?.name} telah dicatat keluar.`,
        });
      }

      // Reset form
      setFormData({
        itemId: '',
        quantity: '',
        unit: 'pcs',
        additionalCost: '',
        notes: '',
      });

      // Refresh data
      fetchProducts();
      fetchBundles();
    } catch (error: any) {
      console.error('Error saving stock out:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan barang keluar',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      itemId: '',
      quantity: '',
      additionalCost: '',
      notes: '',
    });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat data...</p>;
  }

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
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.nama_produk} (Stok: {product.stok})
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
                    {bundles.map((bundle) => (
                      <SelectItem key={bundle.id} value={bundle.id.toString()}>
                        {bundle.name} - {formatCurrency(bundle.harga_jual)}
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
                    {selectedBundle.bundle_items.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-sm">
                        <span>{item.products.nama_produk}</span>
                        <span className="text-muted-foreground">×{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah *</Label>
                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="flex-1"
                  />
                  {type === 'product' && (
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pcs</SelectItem>
                        <SelectItem value="box" disabled={!selectedProduct?.pcs_per_box}>Box</SelectItem>
                        <SelectItem value="dus" disabled={!selectedProduct?.box_per_dus}>Dus</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {type === 'bundle' && (
                    <div className="flex items-center justify-center w-[100px] border rounded bg-muted text-sm px-3">
                      Pcs
                    </div>
                  )}
                </div>
                {selectedProduct && type === 'product' && formData.unit !== 'pcs' && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Konversi: {formData.unit === 'dus' 
                      ? `1 Dus = ${(selectedProduct.box_per_dus || 1) * (selectedProduct.pcs_per_box || 1)} Pcs` 
                      : `1 Box = ${selectedProduct.pcs_per_box || 1} Pcs`}
                  </p>
                )}
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
                    <span className="text-muted-foreground">Jumlah Input</span>
                    <span className="font-medium">{formData.quantity} {formData.unit}</span>
                  </div>
                  {type === 'product' && formData.unit !== 'pcs' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Stok (Pcs)</span>
                      <span className="font-medium text-chart-2">-{totalPcs} Pcs</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga per {formData.unit}</span>
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
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleReset}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-chart-2 hover:bg-chart-2/90 text-primary-foreground border-0"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Barang Keluar'}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
