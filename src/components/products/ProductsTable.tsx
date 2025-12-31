import { useState } from 'react';
import { mockProducts, mockSuppliers } from '@/data/mockData';
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
import { Input } from '@/components/ui/input';
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
  AlertTriangle,
  Package 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductsTable() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSupplierName = (supplierId: string) => {
    return mockSuppliers.find((s) => s.id === supplierId)?.name || '-';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:w-64"
          />
        </div>
        <Button className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="font-semibold">Produk</TableHead>
              <TableHead className="font-semibold">Kategori</TableHead>
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold text-right">Harga Beli</TableHead>
              <TableHead className="font-semibold text-right">Harga Jual</TableHead>
              <TableHead className="font-semibold text-center">Stok</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => {
              const isLowStock = product.stock <= product.minStock;
              const isKritis = product.stock < product.minStock;

              return (
                <TableRow 
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.unit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getSupplierName(product.supplierId)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.buyPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {formatCurrency(product.sellPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-semibold',
                      isKritis && 'text-destructive',
                      isLowStock && !isKritis && 'text-warning'
                    )}>
                      {product.stock}
                    </span>
                    <span className="text-muted-foreground"> / {product.minStock}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isLowStock ? (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'gap-1',
                          isKritis 
                            ? 'border-destructive/50 bg-destructive/10 text-destructive' 
                            : 'border-warning/50 bg-warning/10 text-warning'
                        )}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {isKritis ? 'Kritis' : 'Menipis'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-success/50 bg-success/10 text-success">
                        Aman
                      </Badge>
                    )}
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
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
