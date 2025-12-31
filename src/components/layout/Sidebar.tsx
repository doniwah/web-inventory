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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Produk', href: '/products', icon: Package },
  { title: 'Bundling', href: '/bundles', icon: Layers },
  { title: 'Barang Masuk', href: '/stock-in', icon: PackagePlus },
  { title: 'Barang Keluar', href: '/stock-out', icon: PackageMinus },
  { title: 'Laporan', href: '/reports', icon: FileText },
  { title: 'Riwayat', href: '/history', icon: History },
];

const masterDataItems: NavItem[] = [
  { title: 'Supplier', href: '/suppliers', icon: Building2 },
  { title: 'Pengguna', href: '/users', icon: Users },
  { title: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="my-4 border-t border-sidebar-border" />

        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 animate-fade-in">
            Master Data
          </p>
        )}
        <div className="space-y-1">
          {masterDataItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-3">
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
    </aside>
  );
}
