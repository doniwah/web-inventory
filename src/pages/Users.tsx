import { MainLayout } from '@/components/layout/MainLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  User,
  Shield,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'owner';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const roleConfig = {
  admin: { 
    label: 'Admin', 
    icon: ShieldCheck, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
  owner: { 
    label: 'Owner', 
    icon: Crown, 
    color: 'bg-warning/10 text-warning border-warning/30' 
  },
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as UserRole,
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pengguna',
        variant: 'destructive',
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle add user
  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password minimal 6 karakter',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Sign up user dengan Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Gagal membuat user');
      }

      // Insert ke public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: 'Berhasil',
        description: 'User berhasil ditambahkan',
      });
      
      setDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal menambahkan user',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus',
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus user',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayout 
      title="Pengguna" 
      subtitle="Kelola akun pengguna dan hak akses"
    >
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button 
            className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold">Pengguna</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada pengguna
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => {
                  const config = roleConfig[user.role];
                  const Icon = config.icon;

                  return (
                    <TableRow 
                      key={user.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-foreground">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn('gap-1.5', config.color)}
                        >
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Pencil className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun pengguna baru dengan mengisi form di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Tambah User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Users;
