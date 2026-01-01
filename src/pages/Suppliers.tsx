import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Building2,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

type Supplier = {
  id: number;
  nama_supplier: string;
  kontak: string;
  alamat: string;
  created_at: string;
};

const Suppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = user?.role === 'owner' || (user?.role === 'admin' && user?.permissions?.suppliers);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    nama_supplier: '',
    kontak: '',
    alamat: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('nama_supplier');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data supplier',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditMode(true);
      setSelectedSupplier(supplier);
      setFormData({
        nama_supplier: supplier.nama_supplier,
        kontak: supplier.kontak || '',
        alamat: supplier.alamat || '',
      });
    } else {
      setEditMode(false);
      setSelectedSupplier(null);
      setFormData({
        nama_supplier: '',
        kontak: '',
        alamat: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nama_supplier) {
      toast({
        title: 'Error',
        description: 'Nama supplier wajib diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const supplierData = {
        nama_supplier: formData.nama_supplier,
        kontak: formData.kontak || null,
        alamat: formData.alamat || null,
      };

      if (editMode && selectedSupplier) {
        // Update
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', selectedSupplier.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Supplier berhasil diupdate',
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('suppliers')
          .insert([supplierData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Supplier berhasil ditambahkan',
        });
      }

      setDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan supplier',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Supplier berhasil dihapus',
      });

      setDeleteDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus supplier',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.nama_supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout title="Supplier" subtitle="Kelola data supplier">
        <p className="text-sm text-muted-foreground">Memuat data...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Supplier" subtitle="Kelola data supplier">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari supplier..."
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
              Tambah Supplier
            </Button>
          )}
        </div>

        {/* Table */}
        {/* Desktop Table View */}
      <div className="rounded-xl border bg-card overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Alamat</TableHead>
              {canManage && <TableHead className="w-[100px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                  Tidak ada supplier
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex gap-3 items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="font-medium text-foreground">{s.nama_supplier}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" /> {s.kontak || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" /> 
                      <span className="truncate max-w-[200px]">{s.alamat || '-'}</span>
                    </div>
                  </TableCell>
                  
                  {canManage && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(s)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedSupplier(s);
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

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editMode ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </DialogTitle>
              <DialogDescription>
                {editMode ? 'Update informasi supplier' : 'Tambahkan supplier baru ke sistem'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_supplier">Nama Supplier *</Label>
                <Input
                  id="nama_supplier"
                  placeholder="Contoh: PT Supplier Indonesia"
                  value={formData.nama_supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_supplier: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kontak">Kontak</Label>
                <Input
                  id="kontak"
                  placeholder="Nomor telepon atau email"
                  value={formData.kontak}
                  onChange={(e) =>
                    setFormData({ ...formData, kontak: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  placeholder="Alamat lengkap supplier"
                  value={formData.alamat}
                  onChange={(e) =>
                    setFormData({ ...formData, alamat: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? 'Menyimpan...'
                  : editMode
                  ? 'Update Supplier'
                  : 'Tambah Supplier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Supplier</DialogTitle>
              <DialogDescription>
                Apakah Anda yakin ingin menghapus supplier "
                {selectedSupplier?.nama_supplier}"? Tindakan ini tidak dapat
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
                {submitting ? 'Menghapus...' : 'Hapus'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Suppliers;
