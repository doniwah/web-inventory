import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockSuppliers } from '@/data/mockData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
  Building2,
  Phone,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Suppliers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = mockSuppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="Supplier" 
      subtitle="Kelola data supplier"
    >
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          <Button className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow">
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold">Supplier</TableHead>
                <TableHead className="font-semibold">Kontak</TableHead>
                <TableHead className="font-semibold">Alamat</TableHead>
                <TableHead className="font-semibold">Terdaftar</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier, index) => (
                <TableRow 
                  key={supplier.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                        <Building2 className="h-5 w-5 text-chart-4" />
                      </div>
                      <span className="font-medium text-foreground">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {supplier.contact}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {supplier.address}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(supplier.createdAt, 'dd MMM yyyy', { locale: id })}
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Suppliers;
