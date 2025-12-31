import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Wallet,
  Calendar,
} from 'lucide-react';

const reports = [
  {
    title: 'Laporan Barang Masuk',
    description: 'Total barang masuk per periode',
    icon: TrendingUp,
    color: 'text-success bg-success/10',
  },
  {
    title: 'Laporan Barang Keluar',
    description: 'Total barang keluar per periode',
    icon: TrendingDown,
    color: 'text-chart-2 bg-chart-2/10',
  },
  {
    title: 'Laporan Stok Barang',
    description: 'Posisi stok saat ini',
    icon: Package,
    color: 'text-primary bg-primary/10',
  },
  {
    title: 'Laporan Nilai Aset',
    description: 'Perbandingan aset bulan ini vs bulan lalu',
    icon: Wallet,
    color: 'text-chart-4 bg-chart-4/10',
  },
  {
    title: 'Laporan Margin & Keuntungan',
    description: 'Analisis margin dan profit per produk',
    icon: FileText,
    color: 'text-chart-5 bg-chart-5/10',
  },
];

const Reports = () => {
  return (
    <MainLayout 
      title="Laporan" 
      subtitle="Lihat dan export laporan inventori"
    >
      <div className="space-y-6">
        {/* Date Filter */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Periode: Desember 2024</span>
              </div>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Pilih Periode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <Card 
              key={report.title} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${report.color} transition-transform group-hover:scale-110`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2">
                    <FileText className="h-4 w-4" />
                    Lihat
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
