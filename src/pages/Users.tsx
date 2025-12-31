import { MainLayout } from '@/components/layout/MainLayout';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  User,
  Shield,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockUsers = [
  { id: '1', name: 'Administrator', email: 'admin@stokpro.com', role: 'admin' as const },
  { id: '2', name: 'Staff Gudang', email: 'gudang@stokpro.com', role: 'gudang' as const },
  { id: '3', name: 'Owner', email: 'owner@stokpro.com', role: 'owner' as const },
];

const roleConfig = {
  admin: { 
    label: 'Admin', 
    icon: ShieldCheck, 
    color: 'bg-primary/10 text-primary border-primary/30' 
  },
  gudang: { 
    label: 'Gudang', 
    icon: Shield, 
    color: 'bg-chart-2/10 text-chart-2 border-chart-2/30' 
  },
  owner: { 
    label: 'Owner', 
    icon: Crown, 
    color: 'bg-warning/10 text-warning border-warning/30' 
  },
};

const Users = () => {
  return (
    <MainLayout 
      title="Pengguna" 
      subtitle="Kelola akun pengguna dan hak akses"
    >
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button className="gap-2 gradient-primary text-primary-foreground border-0 shadow-glow">
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-semibold">Pengguna</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user, index) => {
                const config = roleConfig[user.role];
                const Icon = config.icon;

                return (
                  <TableRow 
                    key={user.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('gap-1.5', config.color)}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
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
    </MainLayout>
  );
};

export default Users;
