import { useState } from 'react';
import { mockActivityLogs } from '@/data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

  const filteredLogs = mockActivityLogs.filter((log) => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
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
            {filteredLogs.map((log, index) => {
              const config = typeConfig[log.type];
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
                      className={cn('gap-1.5', config.color)}
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {log.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.userName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(log.timestamp, 'dd MMM yyyy, HH:mm', { locale: id })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
