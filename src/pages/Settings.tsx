import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Download, 
  Upload, 
  Bell, 
  Save,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type UserSettings = {
  low_stock_alerts: boolean;
  auto_backup: boolean;
};

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    low_stock_alerts: true,
    auto_backup: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user settings
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          low_stock_alerts: data.low_stock_alerts ?? true,
          auto_backup: data.auto_backup ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          low_stock_alerts: settings.low_stock_alerts,
          auto_backup: settings.auto_backup,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Pengaturan berhasil disimpan',
      });

      // Trigger a page reload to update header notifications
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      toast({
        title: 'Memproses...',
        description: 'Sedang membuat backup data',
      });

      // Fetch all data from important tables
      const [products, bundles, suppliers, stockIn, stockOut, activityLogs] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('bundles').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('stock_in').select('*'),
        supabase.from('stock_out').select('*'),
        supabase.from('activity_logs').select('*'),
      ]);

      // Check for errors
      if (products.error || bundles.error || suppliers.error || stockIn.error || stockOut.error || activityLogs.error) {
        throw new Error('Gagal mengambil data dari database');
      }

      // Create backup object
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          products: products.data,
          bundles: bundles.data,
          suppliers: suppliers.data,
          stock_in: stockIn.data,
          stock_out: stockOut.data,
          activity_logs: activityLogs.data,
        },
      };

      // Convert to JSON and download
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stokpro_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Berhasil',
        description: 'Backup berhasil diunduh',
      });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat backup',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreData = () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        toast({
          title: 'Memproses...',
          description: 'Sedang memulihkan data',
        });

        // Read file
        const text = await file.text();
        const backup = JSON.parse(text);

        // Validate backup structure
        if (!backup.version || !backup.data) {
          throw new Error('Format backup tidak valid');
        }

        // Confirm restore
        if (!confirm('⚠️ PERINGATAN: Restore akan menghapus semua data yang ada dan menggantinya dengan data dari backup. Lanjutkan?')) {
          return;
        }

        // Restore data (in order to respect foreign keys)
        const restoreOrder = [
          { table: 'activity_logs', data: backup.data.activity_logs },
          { table: 'stock_out', data: backup.data.stock_out },
          { table: 'stock_in', data: backup.data.stock_in },
          { table: 'bundles', data: backup.data.bundles },
          { table: 'products', data: backup.data.products },
          { table: 'suppliers', data: backup.data.suppliers },
        ];

        for (const { table, data } of restoreOrder) {
          if (data && data.length > 0) {
            // Delete existing data
            await supabase.from(table).delete().neq('id', 0);
            
            // Insert backup data
            const { error } = await supabase.from(table).insert(data);
            if (error) {
              console.error(`Error restoring ${table}:`, error);
              throw new Error(`Gagal restore tabel ${table}`);
            }
          }
        }

        toast({
          title: 'Berhasil',
          description: 'Data berhasil dipulihkan. Halaman akan dimuat ulang.',
        });

        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error: any) {
        console.error('Error restoring data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Gagal memulihkan data',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <MainLayout title="Pengaturan" subtitle="Konfigurasi sistem">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Pengaturan" 
      subtitle="Konfigurasi sistem"
    >
      <div className="grid gap-6 max-w-2xl">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base">Notifikasi</CardTitle>
                <CardDescription>Pengaturan alert dan notifikasi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div>
                <Label className="cursor-pointer">Alert Stok Menipis</Label>
                <p className="text-sm text-muted-foreground">
                  Tampilkan notifikasi saat stok di bawah minimum
                </p>
              </div>
              <Switch 
                checked={settings.low_stock_alerts}
                onCheckedChange={(checked) => setSettings({ ...settings, low_stock_alerts: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Backup & Restore</CardTitle>
                <CardDescription>Kelola backup database</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div>
                <Label className="cursor-pointer">Backup Otomatis</Label>
                <p className="text-sm text-muted-foreground">
                  Backup database setiap hari pukul 00:00
                </p>
              </div>
              <Switch 
                checked={settings.auto_backup}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_backup: checked })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={handleDownloadBackup}
              >
                <Download className="h-4 w-4" />
                Download Backup
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                onClick={handleRestoreData}
              >
                <Upload className="h-4 w-4" />
                Restore Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
