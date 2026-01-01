import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, RefreshCw } from 'lucide-react';
import { UserPermissions } from '@/contexts/AuthContext';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  permissions: UserPermissions;
};

const defaultPermissions: UserPermissions = {
  products: true,
  bundles: true,
  stock_in: true,
  stock_out: true,
  reports: false,
  history: false,
  suppliers: false,
  users: false,
  settings: false,
  dashboard: true,
};

const permissionLabels: Record<keyof UserPermissions, string> = {
  products: 'Produk',
  bundles: 'Bundling',
  stock_in: 'Barang Masuk',
  stock_out: 'Barang Keluar',
  reports: 'Laporan',
  history: 'Riwayat Aktivitas',
  suppliers: 'Supplier',
  users: 'Manajemen User',
  settings: 'Pengaturan',
  dashboard: 'Dashboard',
};

const AdminPermissions = () => {
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, permissions')
        .eq('role', 'admin')
        .order('name');

      if (error) throw error;

      const admins: AdminUser[] = (data || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        permissions: user.permissions || defaultPermissions,
      }));

      setAdminUsers(admins);
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data admin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (userId: string, permission: keyof UserPermissions) => {
    setAdminUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [permission]: !user.permissions[permission],
              },
            }
          : user
      )
    );
  };

  const savePermissions = async (userId: string) => {
    setSaving(true);
    try {
      const user = adminUsers.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ permissions: user.permissions })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Permissions untuk ${user.name} berhasil disimpan`,
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPermissions = (userId: string) => {
    setAdminUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, permissions: defaultPermissions }
          : user
      )
    );
  };

  return (
    <MainLayout
      title="Admin Permissions"
      subtitle="Kelola akses dan izin untuk setiap admin"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat data admin...</p>
          </div>
        ) : adminUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tidak ada admin user yang ditemukan</p>
            </CardContent>
          </Card>
        ) : (
          adminUsers.map((user, index) => (
            <Card
              key={user.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetPermissions(user.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => savePermissions(user.id)}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map(
                    (permission) => (
                      <div
                        key={permission}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <Label
                          htmlFor={`${user.id}-${permission}`}
                          className="cursor-pointer flex-1"
                        >
                          {permissionLabels[permission]}
                        </Label>
                        <Switch
                          id={`${user.id}-${permission}`}
                          checked={user.permissions[permission]}
                          onCheckedChange={() => togglePermission(user.id, permission)}
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default AdminPermissions;
