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
  Shield,
  Save,
} from 'lucide-react';

const Settings = () => {
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
            <div className="flex items-center justify-between">
              <div>
                <Label>Alert Stok Menipis</Label>
                <p className="text-sm text-muted-foreground">
                  Tampilkan notifikasi saat stok di bawah minimum
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifikasi</Label>
                <p className="text-sm text-muted-foreground">
                  Kirim email untuk alert penting
                </p>
              </div>
              <Switch />
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
            <div className="flex items-center justify-between">
              <div>
                <Label>Backup Otomatis</Label>
                <p className="text-sm text-muted-foreground">
                  Backup database setiap hari pukul 00:00
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download Backup
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                Restore Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/10">
                <Shield className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <CardTitle className="text-base">Keamanan</CardTitle>
                <CardDescription>Pengaturan keamanan akun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Tambahkan lapisan keamanan ekstra
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">
                  Logout otomatis setelah 30 menit tidak aktif
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Button className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
