import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  PackagePlus, 
  PackageMinus, 
  Settings, 
  DollarSign, 
  Layers,
  Filter,
  Calendar,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ActivityLog = {
  id: number;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'price_change' | 'product_create' | 'bundle_create';
  description: string;
  user_name: string;
  timestamp: Date;
};

const typeConfig = {
  stock_in: { 
    label: 'Barang Masuk', 
    icon: PackagePlus, 
    color: 'bg-success/10 text-success border-success/30' 
  },
  stock_out: { 
    label: 'Barang Keluar', 
    icon: PackageMinus, 
    color: 'bg-chart-2/10 text-chart-2 border-chart-2/30' 
  },
  adjustment: { 
    label: 'Penyesuaian', 
    icon: Settings, 
    color: 'bg-warning/10 text-warning border-warning/30' 
  },
  price_change: { 
    label: 'Perubahan Harga', 
    icon: DollarSign, 
    color: 'bg-chart-4/10 text-chart-4 border-chart-4/30' 
  },
  product_create: { 
    label: 'Produk Baru', 
    icon: PackagePlus, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
  bundle_create: { 
    label: 'Bundle Baru', 
    icon: Layers, 
    color: 'bg-chart-5/10 text-chart-5 border-chart-5/30' 
  },
};

export function ActivityHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, current, last, last3, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // Get date range based on filter
  const getDateRange = () => {
    const now = new Date();
    
    switch (dateFilter) {
      case 'current':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last':
        const lastMonth = subMonths(now, 1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: startOfDay(new Date(customStartDate)),
            end: endOfDay(new Date(customEndDate))
          };
        }
        return null;
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [page, dateFilter, customStartDate, customEndDate]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Get total count first with date filter
      let countQuery = supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true });
      
      const dateRange = getDateRange();
      
      // Debug logging
      if (dateRange) {
        console.log('Date Filter Applied:', {
          filter: dateFilter,
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        });
      } else {
        console.log('No Date Filter (showing all)');
      }
      
      if (dateRange) {
        countQuery = countQuery
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }

      const { count } = await countQuery;

      if (count) {
        setTotalPages(Math.ceil(count / PAGE_SIZE));
      }

      // First try with user join
      let query = supabase
        .from('activity_logs')
        .select(`
          id, 
          type, 
          aktivitas,
          created_at,
          user_id,
          users!user_id (name)
        `);
      
      // Apply date filter
      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start.toISOString())
          .lte('created_at', dateRange.end.toISOString());
      }
      
      let { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      // If join fails, try without join and fetch users separately
      if (error) {
        console.log('Trying without user join...', error);
        let fallbackQuery = supabase
          .from('activity_logs')
          .select('id, type, aktivitas, created_at, user_id');
        
        // Apply date filter to fallback query too
        if (dateRange) {
          fallbackQuery = fallbackQuery
            .gte('created_at', dateRange.start.toISOString())
            .lte('created_at', dateRange.end.toISOString());
        }
        
        const result = await fallbackQuery
          .order('created_at', { ascending: false })
          .range(from, to);
        
        data = result.data;
        error = result.error;

        // Fetch user names separately if we have user_ids
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map((item: any) => item.user_id).filter(Boolean))];
          if (userIds.length > 0) {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, name')
              .in('id', userIds);

            // Map user names to activities
            if (usersData) {
              const userMap = new Map(usersData.map((u: any) => [u.id, u.name]));
              data = data.map((item: any) => ({
                ...item,
                users: item.user_id ? { name: userMap.get(item.user_id) } : null
              }));
            }
          }
        }
      }

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      if (data) {
        const activities: ActivityLog[] = data.map((item: any) => ({
          id: item.id,
          type: item.type || 'stock_in',
          description: item.aktivitas || 'No description',
          user_name: item.users?.name || 'System',
          timestamp: new Date(item.created_at),
        }));

        setLogs(activities);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Memuat data...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="stock_in">Barang Masuk</SelectItem>
              <SelectItem value="stock_out">Barang Keluar</SelectItem>
              <SelectItem value="adjustment">Penyesuaian</SelectItem>
              <SelectItem value="price_change">Perubahan Harga</SelectItem>
              <SelectItem value="product_create">Produk Baru</SelectItem>
              <SelectItem value="bundle_create">Bundle Baru</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua Tanggal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tanggal</SelectItem>
              <SelectItem value="current">Bulan Ini</SelectItem>
              <SelectItem value="last">Bulan Lalu</SelectItem>
              <SelectItem value="custom">Pilih Tanggal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Date Range */}
      {dateFilter === 'custom' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center p-4 bg-secondary/30 rounded-lg border">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Dari Tanggal</label>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              max={customEndDate || undefined}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Sampai Tanggal</label>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              min={customStartDate || undefined}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-x-auto custom-scrollbar">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="font-semibold">Tipe</TableHead>
              <TableHead className="font-semibold">Deskripsi</TableHead>
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Tidak ada data aktivitas
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log, index) => {
                const config = typeConfig[log.type] || typeConfig.adjustment;
                const Icon = config.icon;

                return (
                  <TableRow 
                    key={log.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('gap-1.5 whitespace-nowrap', config.color)}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground min-w-[200px]">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {log.user_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(log.timestamp, 'dd MMM yyyy, HH:mm', { locale: id })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
