import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  PackageMinus,
  Layers,
  FileText,
  History,
  Settings,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  Box,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth, UserRole, UserPermissions } from '@/hooks/useAuth';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: UserRole[];
  permission?: keyof UserPermissions;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'owner'], permission: 'dashboard' },
  { title: 'Produk', href: '/products', icon: Package, roles: ['admin', 'owner'], permission: 'products' },
  { title: 'Bundling', href: '/bundles', icon: Layers, roles: ['admin', 'owner'], permission: 'bundles' },
  { title: 'Barang Masuk', href: '/stock-in', icon: PackagePlus, roles: ['admin', 'owner'], permission: 'stock_in' },
  { title: 'Barang Keluar', href: '/stock-out', icon: PackageMinus, roles: ['admin', 'owner'], permission: 'stock_out' },
  { title: 'Laporan', href: '/reports', icon: FileText, roles: ['admin', 'owner'], permission: 'reports' },
  { title: 'Riwayat', href: '/history', icon: History, roles: ['admin', 'owner'], permission: 'history' },
];

const masterDataItems: NavItem[] = [
  { title: 'Supplier', href: '/suppliers', icon: Building2, roles: ['admin', 'owner'], permission: 'suppliers' },
  { title: 'Pengguna', href: '/users', icon: Users, roles: ['owner'] },
  { title: 'Admin Permissions', href: '/admin-permissions', icon: Shield, roles: ['owner'] },
  { title: 'Pengaturan', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if user has permission for a menu item
  const hasPermission = (item: NavItem): boolean => {
    if (!user) return false;
    
    // Owner has access to everything
    if (user.role === 'owner') return true;
    
    // Check role
    if (item.roles && !item.roles.includes(user.role)) return false;
    
    // Check permission for admin
    if (item.permission && user.role === 'admin') {
      return user.permissions?.[item.permission] ?? false;
    }
    
    return true;
  };

  // Filter menu items based on user role and permissions
  const filteredNavItems = navItems.filter(hasPermission);
  const filteredMasterDataItems = masterDataItems.filter(hasPermission);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;

    const content = (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'drop-shadow-sm')} />
        {!collapsed && (
          <span className="animate-fade-in">{item.title}</span>
        )}
        {!collapsed && item.badge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo & Close Button */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Box className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">StokPro</span>
              <span className="text-[10px] text-sidebar-foreground/60">Inventory System</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Box className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        
        {/* Mobile Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setIsMobileOpen?.(false)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        onClick={() => {
          if (window.innerWidth < 1024) setIsMobileOpen?.(false);
        }}
      >
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {filteredMasterDataItems.length > 0 && (
          <>
            <div className="my-4 border-t border-sidebar-border" />

            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 animate-fade-in">
                Master Data
              </p>
            )}
            <div className="space-y-1">
              {filteredMasterDataItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Keluar</span>
            </Button>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Tutup</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
