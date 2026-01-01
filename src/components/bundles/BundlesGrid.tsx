import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Layers, 
  Package,
  AlertTriangle,
  Check,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Bundle = {
  id: number;
  name: string;
  harga_jual: number;
  bundle_items: {
    product_id: number;
    qty: number;
    products: {
      id: number;
      nama_produk: string;
      stok: number;
    };
  }[];
};

type Product = {
  id: number;
  nama_produk: string;
  stok: number;
  harga_jual: number;
};

type BundleItem = {
  product_id: number;
  qty: number;
};

export function BundlesGrid() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const canManage = user?.role === 'owner' || (user?.role === 'admin' && user?.permissions?.bundles);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    harga_jual: '',
  });
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');

  const { toast } = useToast();

  const fetchBundles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        id,
        name,
        harga_jual,
        bundle_items (
          product_id,
          qty,
          products (
            id,
            nama_produk,
            stok
          )
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching bundles:', error);
    } else {
      setBundles(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, nama_produk, stok, harga_jual')
      .order('nama_produk');
    setProducts(data || []);
  };

  useEffect(() => {
    fetchBundles();
    fetchProducts();

    // Real-time subscription
    const channel = supabase
      .channel('bundles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bundles' },
        () => fetchBundles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditMode(true);
      setSelectedBundle(bundle);
      setFormData({
        name: bundle.name,
        harga_jual: bundle.harga_jual.toString(),
      });
      setBundleItems(
        bundle.bundle_items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
        }))
      );
    } else {
      setEditMode(false);
      setSelectedBundle(null);
      setFormData({
        name: '',
        harga_jual: '',
      });
      setBundleItems([]);
    }
    setDialogOpen(true);
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !selectedQuantity) return;

    const productId = parseInt(selectedProductId);
    const qty = parseInt(selectedQuantity);

    // Check if product already added
    if (bundleItems.find((item) => item.product_id === productId)) {
      toast({
        title: 'Error',
        description: 'Produk sudah ditambahkan',
        variant: 'destructive',
      });
      return;
    }

    setBundleItems([...bundleItems, { product_id: productId, qty }]);
    setSelectedProductId('');
    setSelectedQuantity('1');
  };

  const handleRemoveProduct = (productId: number) => {
    setBundleItems(bundleItems.filter((item) => item.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.harga_jual || bundleItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Nama, harga, dan minimal 1 produk harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const bundleData = {
        name: formData.name,
        harga_jual: parseInt(formData.harga_jual),
      };

      if (editMode && selectedBundle) {
        // Update bundle
        const { error: bundleError } = await supabase
          .from('bundles')
          .update(bundleData)
          .eq('id', selectedBundle.id);

        if (bundleError) throw bundleError;

        // Delete old items
        await supabase
          .from('bundle_items')
          .delete()
          .eq('bundle_id', selectedBundle.id);

        // Insert new items
        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(
            bundleItems.map((item) => ({
              bundle_id: selectedBundle.id,
              product_id: item.product_id,
              qty: item.qty,
            }))
          );

        if (itemsError) throw itemsError;

        toast({
          title: 'Berhasil',
          description: 'Bundle berhasil diupdate',
        });
      } else {
        // Insert bundle
        const { data: newBundle, error: bundleError } = await supabase
          .from('bundles')
          .insert([bundleData])
          .select()
          .single();

        if (bundleError) throw bundleError;

        // Insert items
        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(
            bundleItems.map((item) => ({
              bundle_id: newBundle.id,
              product_id: item.product_id,
              qty: item.qty,
            }))
          );

        if (itemsError) throw itemsError;

        // Log activity for new bundle
        const itemsList = bundleItems.map(item => {
          const productName = getProductName(item.product_id);
          return `${productName} (${item.qty}x)`;
        }).join(', ');
        
        await logActivity(
          'bundle_create',
          `Bundle baru: ${formData.name} - Isi: ${itemsList}`,
          user?.id ? user.id : undefined
        );

        toast({
          title: 'Berhasil',
          description: 'Bundle berhasil ditambahkan',
        });
      }

      setDialogOpen(false);
      fetchBundles();
    } catch (error: any) {
      console.error('Error saving bundle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan bundle',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBundle) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', selectedBundle.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Bundle berhasil dihapus',
      });

      setDeleteDialogOpen(false);
      fetchBundles();
    } catch (error: any) {
      console.error('Error deleting bundle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus bundle',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBundles = bundles.filter((bundle) =>
    bundle.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const checkBundleAvailability = (bundle: Bundle) => {
    for (const item of bundle.bundle_items) {
      if (item.products.stok < item.qty) {
        return { available: false, missingItem: item.products.nama_produk };
      }
    }
    return { available: true, missingItem: null };
  };

  const calculateMaxBundles = (bundle: Bundle) => {
    let maxCount = Infinity;
    for (const item of bundle.bundle_items) {
      const possible = Math.floor(item.products.stok / item.qty);
      maxCount = Math.min(maxCount, possible);
    }
    return maxCount === Infinity ? 0 : maxCount;
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.nama_produk || '-';
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat bundle...</p>;
  }

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
        {canManage && (
          <Button
            className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="h-4 w-4" />
            Buat Bundling
          </Button>
        )}
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
                'group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                !available && 'border-destructive/30'
              )}
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
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleOpenDialog(bundle)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => {
                          setSelectedBundle(bundle);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items List */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Isi Bundle ({bundle.bundle_items.length} item)
                  </p>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {bundle.bundle_items.map((item) => {
                      const hasStock = item.products.stok >= item.qty;

                      return (
                        <div
                          key={item.product_id}
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
                              {item.products.nama_produk}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">×{item.qty}</span>
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
                      {formatCurrency(bundle.harga_jual)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Bundle' : 'Buat Bundle Baru'}
            </DialogTitle>
            <DialogDescription>
              {editMode ? 'Update informasi bundle' : 'Tambahkan bundle baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Bundle *</Label>
              <Input
                id="name"
                placeholder="Contoh: Hampers Lebaran"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga_jual">Harga Jual *</Label>
              <Input
                id="harga_jual"
                type="number"
                placeholder="0"
                value={formData.harga_jual}
                onChange={(e) =>
                  setFormData({ ...formData, harga_jual: e.target.value })
                }
              />
            </div>

            {/* Product Selector */}
            <div className="space-y-2">
              <Label>Produk dalam Bundle *</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="flex-1">
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
                <Input
                  type="number"
                  placeholder="Qty"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  className="w-20"
                />
                <Button type="button" onClick={handleAddProduct}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Products */}
            {bundleItems.length > 0 && (
              <div className="space-y-2">
                <Label>Produk Terpilih ({bundleItems.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {bundleItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm">
                        {getProductName(item.product_id)} × {item.qty}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveProduct(item.product_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Menyimpan...'
                : editMode
                ? 'Update Bundle'
                : 'Tambah Bundle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Bundle</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus bundle "
              {selectedBundle?.name}"? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
