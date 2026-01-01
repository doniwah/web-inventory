import { useEffect, useState } from 'react';
import { Bell, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

type LowStockProduct = {
  id: number;
  nama_produk: string;
  stok: number;
  stok_minimum: number;
};

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
      fetchLowStockProducts();

      // Real-time subscription for product changes
      const channel = supabase
        .channel('low-stock-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchLowStockProducts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('low_stock_alerts')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error);
        return;
      }

      setShowLowStockAlerts(data?.low_stock_alerts ?? true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, nama_produk, stok, stok_minimum')
        .order('nama_produk');

      if (error) throw error;

      // Filter products where stock is at or below minimum
      const lowStock = data?.filter(p => p.stok <= p.stok_minimum) || [];
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications - Only show if enabled in settings */}
        {showLowStockAlerts && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {lowStockProducts.length > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-destructive">
                    {lowStockProducts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifikasi Stok</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Tidak ada notifikasi stok menipis
              </div>
            ) : (
              <>
                {lowStockProducts.map((product) => {
                  const isCritical = product.stok < product.stok_minimum;
                  return (
                    <DropdownMenuItem 
                      key={product.id}
                      className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                      onClick={() => navigate('/products')}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className={`h-2 w-2 rounded-full ${
                            isCritical ? 'bg-destructive' : 'bg-warning'
                          }`} 
                        />
                        <span className="font-medium">
                          {isCritical ? 'Stok Kritis' : 'Stok Menipis'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.nama_produk} - {product.stok} pcs 
                        {product.stok < product.stok_minimum && ` (min: ${product.stok_minimum})`}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden font-medium md:inline-block">
                {user?.name || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
