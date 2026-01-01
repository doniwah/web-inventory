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
import { PackagePlus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Product = {
  id: number;
  nama_produk: string;
  stok: number;
  harga_beli: number;
  harga_beli_dus?: number;
  harga_beli_pack?: number;
  box_per_dus?: number;
  pcs_per_box?: number;
};

type Supplier = {
  id: number;
  nama_supplier: string;
};

export function StockInForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    unit: 'pcs',
    buyPrice: '',
    notes: '',
  });

  const selectedProduct = products.find((p) => p.id === parseInt(formData.productId));
  const totalPrice = Number(formData.quantity) * Number(formData.buyPrice);

  const [totalPcs, setTotalPcs] = useState(0);

  // Auto-populate price based on unit selection
  useEffect(() => {
    if (selectedProduct && formData.unit) {
      let suggestedPrice = selectedProduct.harga_beli; // Default to Pcs price
      
      if (formData.unit === 'dus' && selectedProduct.harga_beli_dus) {
        suggestedPrice = selectedProduct.harga_beli_dus;
      } else if (formData.unit === 'pack' && selectedProduct.harga_beli_pack) {
        suggestedPrice = selectedProduct.harga_beli_pack;
      }
      
      // Only auto-fill if buyPrice is empty
      if (!formData.buyPrice) {
        setFormData(prev => ({ ...prev, buyPrice: suggestedPrice.toString() }));
      }
    }
  }, [formData.unit, selectedProduct]);

  useEffect(() => {
    if (selectedProduct && formData.quantity) {
      const qty = parseInt(formData.quantity) || 0;
      let calculatedPcs = qty;

      if (formData.unit === 'dus') {
        calculatedPcs = qty * (selectedProduct.box_per_dus || 1) * (selectedProduct.pcs_per_box || 1);
      } else if (formData.unit === 'pack') {
        calculatedPcs = qty * (selectedProduct.pcs_per_box || 1);
      }

      setTotalPcs(calculatedPcs);
    } else {
      setTotalPcs(0);
    }
  }, [formData.quantity, formData.unit, selectedProduct]);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, nama_produk, stok, harga_beli, harga_beli_dus, harga_beli_pack, box_per_dus, pcs_per_box')
      .order('nama_produk');
    setProducts(data || []);
    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('id, nama_supplier')
      .order('nama_supplier');
    setSuppliers(data || []);
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

    if (!formData.productId || !formData.supplierId || !formData.quantity || !formData.buyPrice) {
      toast({
        title: 'Error',
        description: 'Semua field wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const productId = parseInt(formData.productId);
      const quantity = parseInt(formData.quantity);
      const buyPrice = parseInt(formData.buyPrice);

      // 1. Update stock produk
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stok')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;
      
      const newStock = currentProduct.stok + totalPcs;

      const { error: updateError } = await supabase
        .from('products')
        .update({ stok: newStock })
        .eq('id', productId);

      if (updateError) throw updateError;

      // 2. Insert transaksi barang masuk
      const { error: transactionError } = await supabase
        .from('stock_in')
        .insert([
          {
            product_id: productId,
            supplier_id: parseInt(formData.supplierId),
            qty: totalPcs,
            unit: formData.unit, // Save unit used in transaction
            harga_beli_per_unit: buyPrice, // Save price per unit for audit
            unit_transaksi: formData.unit,
            qty_transaksi: quantity,
            harga_beli: buyPrice,
            total_harga: totalPrice,
            keterangan: formData.notes || null,
            tanggal: new Date().toISOString(),
          },
        ]);

      if (transactionError) throw transactionError;

      // Log activity
      const supplierName = suppliers.find(s => s.id === parseInt(formData.supplierId))?.nama_supplier || 'Unknown';
      await logActivity(
        'stock_in',
        `${formData.quantity} ${formData.unit} (${totalPcs} pcs) ${selectedProduct?.nama_produk} dari ${supplierName}`,
        user?.id ? user.id : undefined
      );

      toast({
        title: 'Barang Masuk Berhasil',
        description: `${quantity} pcs ${selectedProduct?.nama_produk} telah ditambahkan ke stok.`,
      });

      // Reset form
      setFormData({
        productId: '',
        supplierId: '',
        quantity: '',
        unit: 'pcs',
        buyPrice: '',
        notes: '',
      });

      // Refresh products to show updated stock
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving stock in:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan barang masuk',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      productId: '',
      supplierId: '',
      quantity: '',
      unit: 'pcs',
      buyPrice: '',
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
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.nama_produk} (Stok: {product.stok})
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
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.nama_supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pcs</SelectItem>
                      <SelectItem value="pack" disabled={!selectedProduct?.pcs_per_box}>Pack</SelectItem>
                      <SelectItem value="dus" disabled={!selectedProduct?.box_per_dus}>Dus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedProduct && formData.unit !== 'pcs' && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Konversi: {formData.unit === 'dus' 
                      ? `1 Dus = ${(selectedProduct.box_per_dus || 1) * (selectedProduct.pcs_per_box || 1)} Pcs` 
                      : `1 Pack = ${selectedProduct.pcs_per_box || 1} Pcs`}
                  </p>
                )}
                {selectedProduct && (!selectedProduct.pcs_per_box || !selectedProduct.box_per_dus) && (
                  <p className="text-[10px] text-orange-500 italic">
                    * Satuan Dus/Pack terkunci? Atur konversi di Master Produk.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyPrice">Harga Beli / unit *</Label>
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
                  <span className="text-muted-foreground">Jumlah Input</span>
                  <span className="font-medium">{formData.quantity} {formData.unit}</span>
                </div>
                {formData.unit !== 'pcs' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Stok (Pcs)</span>
                    <span className="font-medium text-primary">+{totalPcs} Pcs</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga per {formData.unit}</span>
                  <span className="font-medium">{formatCurrency(Number(formData.buyPrice))}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-medium">Total Bayar</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(totalPrice)}</span>
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
              className="flex-1 gradient-primary text-primary-foreground border-0"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Barang Masuk'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
