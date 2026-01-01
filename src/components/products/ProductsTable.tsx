import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

type Product = {
  id: number;
  nama_produk: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
  box_per_dus?: number;
  pcs_per_box?: number;
  supplier_id?: number;
  satuan_id?: number;
  suppliers?: { nama_supplier: string } | null;
  satuans?: { nama_satuan: string } | null;
};

type Supplier = {
  id: number;
  nama_supplier: string;
};

type Satuan = {
  id: number;
  nama_satuan: string;
};

export function ProductsTable() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [satuans, setSatuans] = useState<Satuan[]>([]);
  const [allSatuans, setAllSatuans] = useState<Satuan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  const canManage = user?.role === 'owner' || (user?.role === 'admin' && user?.permissions?.products);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    nama_produk: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    stok_minimum: "",
    box_per_dus: "",
    pcs_per_box: "",
    supplier_id: "",
    satuan_id: "",
    adjustment_reason: "",
  });

  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("products")
      .select(
        `
          id, nama_produk, harga_beli, harga_jual, stok, stok_minimum, 
          box_per_dus, pcs_per_box, supplier_id, satuan_id,
          suppliers!supplier_id ( nama_supplier ),
          satuans!satuan_id ( nama_satuan )
        `
      )
      .order("nama_produk")
      .range(from, to);

    if (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  };

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from("suppliers")
      .select("id, nama_supplier")
      .order("nama_supplier");
    setSuppliers(data ?? []);
  };

  const fetchSatuans = async () => {
    const { data } = await supabase
      .from("satuans")
      .select("id, nama_satuan")
      .order("nama_satuan");
    
    // Transform data to map units correctly
    // box -> Dus (Top), pack -> Pack (Middle), pcs -> Pcs (Bottom)
    const mappedData = (data ?? []).map(s => {
      let name = s.nama_satuan;
      const lowerName = name.toLowerCase();
      if (lowerName === 'box') name = 'Dus';
      if (lowerName === 'pack') name = 'Pack';
      if (lowerName === 'dus') name = 'Dus';
      return { ...s, nama_satuan: name };
    });
    
    setAllSatuans(mappedData);
    
    // Remove duplicates only for the dropdown selection
    const uniqueSatuans = mappedData.filter((v, i, a) => a.findIndex(t => t.nama_satuan === v.nama_satuan) === i);
    setSatuans(uniqueSatuans);
  };

  // Fetch requirements
  useEffect(() => {
    fetchSuppliers();
    fetchSatuans();
  }, []);

  // Fetch + realtime
  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditMode(true);
      setSelectedProduct(product);
      
      // Convert stored Pcs to display unit value (if Dus/Pack)
      let displayStok = product.stok;
      const boxPerDus = product.box_per_dus || 0;
      const pcsPerBox = product.pcs_per_box || 0;
      
      // We need to fetch the unit name for this product
      // Since fetchSatuans might not have been called yet or state is pending, 
      // we check the joined data from product.
      const unitName = product.satuans?.nama_satuan?.toLowerCase() || '';
      const isDusDisplay = unitName === 'box' || unitName === 'dus';
      const isPackDisplay = unitName === 'pack';

      if (isDusDisplay && boxPerDus && pcsPerBox) {
        displayStok = Math.floor(product.stok / (boxPerDus * pcsPerBox));
      } else if (isPackDisplay && pcsPerBox) {
        displayStok = Math.floor(product.stok / pcsPerBox);
      }

      setFormData({
        nama_produk: product.nama_produk,
        harga_beli: product.harga_beli.toString(),
        harga_jual: product.harga_jual.toString(),
        stok: displayStok.toString(),
        stok_minimum: product.stok_minimum.toString(),
        box_per_dus: product.box_per_dus?.toString() || "",
        pcs_per_box: product.pcs_per_box?.toString() || "",
        supplier_id: product.supplier_id?.toString() || "",
        satuan_id: product.satuan_id?.toString() || "",
        adjustment_reason: ""
      });
    } else {
      setEditMode(false);
      setSelectedProduct(null);
      setFormData({
        nama_produk: "",
        harga_beli: "",
        harga_jual: "",
        stok: "",
        stok_minimum: "",
        box_per_dus: "",
        pcs_per_box: "",
        supplier_id: "",
        satuan_id: "",
        adjustment_reason: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nama_produk || !formData.harga_beli || !formData.harga_jual) {
      toast({
        title: "Error",
        description: "Nama produk, harga beli, dan harga jual harus diisi",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let finalStok = parseInt(formData.stok) || 0;
      const boxPerDus = parseInt(formData.box_per_dus) || 0;
      const pcsPerBox = parseInt(formData.pcs_per_box) || 0;

      // Convert input to Pcs if unit is Dus or Pack
      // Use allSatuans for more reliable ID lookup
      const selectedSatuan = (allSatuans.length > 0 ? allSatuans : satuans).find(s => s.id.toString() === formData.satuan_id);
      const isDus = selectedSatuan?.nama_satuan.toLowerCase() === 'box' || selectedSatuan?.nama_satuan.toLowerCase() === 'dus';
      const isPack = selectedSatuan?.nama_satuan.toLowerCase() === 'pack' || (selectedSatuan?.nama_satuan === 'Pack');

      if (isDus && boxPerDus && pcsPerBox) {
        finalStok = finalStok * boxPerDus * pcsPerBox;
      } else if (isPack && pcsPerBox) {
        finalStok = finalStok * pcsPerBox;
      }

      const productData = {
        nama_produk: formData.nama_produk,
        harga_beli: parseInt(formData.harga_beli),
        harga_jual: parseInt(formData.harga_jual),
        stok: finalStok,
        stok_minimum: parseInt(formData.stok_minimum) || 0,
        box_per_dus: boxPerDus || null,
        pcs_per_box: pcsPerBox || null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        satuan_id: formData.satuan_id ? parseInt(formData.satuan_id) : null,
      };

      if (editMode && selectedProduct) {
        // Validation check for stock adjustment reason
        const oldStock = selectedProduct.stok;
        if (oldStock !== finalStok && !formData.adjustment_reason) {
          toast({
            title: "Alasan Penting",
            description: "Anda mengubah stok secara manual, harap isi alasan penyesuaian.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        // Update
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", selectedProduct.id);

        if (error) throw error;

        // Log activity if stock changed
        if (oldStock !== finalStok) {
          const difference = finalStok - oldStock;
          const action = difference > 0 ? 'ditambah' : 'dikurangi';
          
          await logActivity(
            'adjustment',
            `Stok ${formData.nama_produk} ${action} ${Math.abs(difference)} Pcs (${oldStock} → ${finalStok}) - Alasan: ${formData.adjustment_reason}`,
            user?.id ? user.id : undefined
          );
        }

        // Log activity if price changed
        const oldHargaBeli = selectedProduct.harga_beli;
        const newHargaBeli = productData.harga_beli;
        const oldHargaJual = selectedProduct.harga_jual;
        const newHargaJual = productData.harga_jual;
        
        if (oldHargaBeli !== newHargaBeli || oldHargaJual !== newHargaJual) {
          const changes = [];
          if (oldHargaBeli !== newHargaBeli) {
            changes.push(`Harga Beli: Rp ${oldHargaBeli.toLocaleString()} → Rp ${newHargaBeli.toLocaleString()}`);
          }
          if (oldHargaJual !== newHargaJual) {
            changes.push(`Harga Jual: Rp ${oldHargaJual.toLocaleString()} → Rp ${newHargaJual.toLocaleString()}`);
          }
          await logActivity(
            'price_change',
            `${formData.nama_produk} - ${changes.join(', ')}`,
            user?.id ? user.id : undefined
          );
        }

        toast({
          title: "Berhasil",
          description: "Produk berhasil diupdate",
        });
      } else {
        // Insert
        const { error } = await supabase
          .from("products")
          .insert([productData]);

        if (error) throw error;

        // Log activity for new product
        await logActivity(
          'product_create',
          `Produk baru ditambahkan: ${formData.nama_produk} (Stok awal: ${productData.stok})`,
          user?.id ? user.id : undefined
        );

        toast({
          title: "Berhasil",
          description: "Produk berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan produk",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);

    try {
      // 1. Check if used in Bundles
      const { data: bundleMatch, error: be } = await supabase
        .from('bundle_items')
        .select('bundle_id')
        .eq('product_id', selectedProduct.id)
        .limit(1);
      
      if (be) throw be;
      if (bundleMatch && bundleMatch.length > 0) {
        throw new Error("Produk tidak bisa dihapus karena masih terdaftar dalam paket bundling.");
      }

      // 2. Check if used in Stock In
      const { data: siMatch, error: sie } = await supabase
        .from('stock_in')
        .select('id')
        .eq('product_id', selectedProduct.id)
        .limit(1);
      
      if (sie) throw sie;
      if (siMatch && siMatch.length > 0) {
        throw new Error("Produk tidak bisa dihapus karena memiliki riwayat stok masuk.");
      }

      // 3. Check if used in Stock Out
      const { data: soMatch, error: soe } = await supabase
        .from('stock_out')
        .select('id')
        .eq('product_id', selectedProduct.id)
        .limit(1);
      
      if (soe) throw soe;
      if (soMatch && soMatch.length > 0) {
        throw new Error("Produk tidak bisa dihapus karena memiliki riwayat transaksi barang keluar.");
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
      });

      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus produk",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.nama_produk.toLowerCase().includes(search.toLowerCase())
  );

  const formatStock = (totalPcs: number, boxPerDus?: number, pcsPerBox?: number) => {
    if (!boxPerDus || !pcsPerBox) return `${totalPcs} Pcs`;

    const pcsInDus = boxPerDus * pcsPerBox;
    const dus = Math.floor(totalPcs / pcsInDus);
    const remainingAfterDus = totalPcs % pcsInDus;
    
    const pack = Math.floor(remainingAfterDus / pcsPerBox);
    const pcs = remainingAfterDus % pcsPerBox;

    const parts = [];
    if (dus > 0) parts.push(`${dus} Dus`);
    if (pack > 0) parts.push(`${pack} Pack`);
    if (pcs > 0 || parts.length === 0) parts.push(`${pcs} Pcs`);

    return parts.join(', ');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat produk...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
                  {canManage && (
          <Button className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Tambah Produk
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto custom-scrollbar">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Satuan</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead className="text-center">Stok</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead />}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredProducts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                Tidak ada produk
              </TableCell>
            </TableRow>
          ) : (
            filteredProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <Package className="h-4 w-4 text-primary" />
                    {p.nama_produk}
                  </div>
                </TableCell>
                <TableCell>{p.satuans?.nama_satuan?.toLowerCase() === 'box' ? 'Dus' : (p.satuans?.nama_satuan?.toLowerCase() === 'pack' ? 'Pack' : (p.satuans?.nama_satuan ?? "-"))}</TableCell>
                <TableCell>{p.suppliers?.nama_supplier ?? "-"}</TableCell>
                <TableCell className="text-right">
                  Rp {p.harga_jual.toLocaleString()}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {formatStock(p.stok, p.box_per_dus, p.pcs_per_box)}
                </TableCell>
                <TableCell>
                  {p.stok === 0 ? (
                    <Badge variant="destructive">Habis</Badge>
                  ) : p.stok <= p.stok_minimum ? (
                    <Badge variant="warning">Menipis</Badge>
                  ) : (
                    <Badge variant="success">Tersedia</Badge>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenDialog(p)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedProduct(p);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Produk" : "Tambah Produk Baru"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Update informasi produk"
                : "Tambahkan produk baru ke inventori"}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-4 py-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="nama_produk">Nama Produk *</Label>
              <Input
                id="nama_produk"
                placeholder="Contoh: Beras Premium"
                value={formData.nama_produk}
                onChange={(e) =>
                  setFormData({ ...formData, nama_produk: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, supplier_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama_supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="satuan">Satuan</Label>
              <Select
                value={formData.satuan_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, satuan_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {satuans.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.nama_satuan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga_beli">Harga Beli *</Label>
              <Input
                id="harga_beli"
                type="number"
                placeholder="0"
                value={formData.harga_beli}
                onChange={(e) =>
                  setFormData({ ...formData, harga_beli: e.target.value })
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

            <div className="space-y-2">
              <Label htmlFor="stok">Stok</Label>
              <Input
                id="stok"
                type="number"
                placeholder="0"
                value={formData.stok}
                onChange={(e) =>
                  setFormData({ ...formData, stok: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stok_minimum">Stok Minimum (Pcs)</Label>
              <Input
                id="stok_minimum"
                type="number"
                placeholder="0"
                value={formData.stok_minimum}
                onChange={(e) =>
                  setFormData({ ...formData, stok_minimum: e.target.value })
                }
              />
            </div>

            <hr className="col-span-2 my-2" />
            <div className="col-span-2">
              <h4 className="text-sm font-semibold mb-2">Konversi Satuan</h4>
            </div>

            <div className="space-y-2">
              <Label htmlFor="box_per_dus">1 Dus Berapa Pack?</Label>
              <Input
                id="box_per_dus"
                type="number"
                placeholder="Contoh: 12"
                value={formData.box_per_dus}
                onChange={(e) =>
                  setFormData({ ...formData, box_per_dus: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pcs_per_box">1 Pack Berapa Pcs?</Label>
              <Input
                id="pcs_per_box"
                type="number"
                placeholder="Contoh: 12"
                value={formData.pcs_per_box}
                onChange={(e) =>
                  setFormData({ ...formData, pcs_per_box: e.target.value })
                }
              />
            </div>
            
            {formData.box_per_dus && formData.pcs_per_box && (
              <div className="col-span-2 text-[10px] text-muted-foreground bg-secondary/30 p-2 rounded">
                Info: 1 Dus = {parseInt(formData.box_per_dus) * parseInt(formData.pcs_per_box)} Pcs
              </div>
            )}

            {editMode && selectedProduct && formData.stok !== selectedProduct.stok.toString() && (
              <div className="col-span-2 space-y-2 mt-2 p-3 border border-warning/30 bg-warning/10 rounded-lg">
                <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Alasan Penyesuaian Stok *
                </div>
                <Textarea
                  placeholder="Contoh: Salah input sebelumnya / Barang rusak / Opname fisik"
                  value={formData.adjustment_reason}
                  onChange={(e) => setFormData({ ...formData, adjustment_reason: e.target.value })}
                  className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">
                  Alasan wajib diisi karena Anda mengubah jumlah stok secara manual.
                </p>
              </div>
            )}
          </div>
        </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Menyimpan..."
                : editMode
                ? "Update Produk"
                : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk "
              {selectedProduct?.nama_produk}"? Tindakan ini tidak dapat
              dibatalkan.
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
              {submitting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
