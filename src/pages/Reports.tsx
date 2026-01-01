import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type StockInItem = {
  id: number;
  tanggal: string;
  qty: number;
  total_harga: number;
  products: { nama_produk: string } | null;
  suppliers: { nama_supplier: string } | null;
};

type StockOutItem = {
  id: number;
  tanggal: string;
  qty: number;
  total_harga: number;
  products: { nama_produk: string } | null;
};

type StockItem = {
  id: number;
  nama_produk: string;
  stok: number;
  stok_minimum: number;
  harga_beli: number;
  harga_jual: number;
};

type AssetComparison = {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
};

type ProductMargin = {
  id: number;
  nama_produk: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  margin: number;
  margin_percent: number;
  potential_profit: number;
};

const Reports = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState('current');
  const [loading, setLoading] = useState(false);
  
  // Dialog states
  const [showStockInDialog, setShowStockInDialog] = useState(false);
  const [showStockOutDialog, setShowStockOutDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showMarginDialog, setShowMarginDialog] = useState(false);
  
  // Data states
  const [stockInData, setStockInData] = useState<StockInItem[]>([]);
  const [stockOutData, setStockOutData] = useState<StockOutItem[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [assetData, setAssetData] = useState<AssetComparison | null>(null);
  const [marginData, setMarginData] = useState<ProductMargin[]>([]);

  const getPeriodDates = () => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'current':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last3':
        startDate = startOfMonth(subMonths(now, 2));
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPeriodLabel = () => {
    const { startDate, endDate } = getPeriodDates();
    return `${format(startDate, 'dd MMM', { locale: id })} - ${format(endDate, 'dd MMM yyyy', { locale: id })}`;
  };

  // Clear cached data when period changes
  useEffect(() => {
    setStockInData([]);
    setStockOutData([]);
    setStockData([]);
    setAssetData(null);
    setMarginData([]);
  }, [period]);

  // Fetch Stock In Data
  const fetchStockInData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          tanggal,
          qty,
          total_harga,
          products (nama_produk),
          suppliers (nama_supplier)
        `)
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString())
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setStockInData(data || []);
      setShowStockInDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stock Out Data
  const fetchStockOutData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          tanggal,
          qty,
          total_harga,
          products (nama_produk)
        `)
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString())
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setStockOutData(data || []);
      setShowStockOutDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stock Data based on period
  const fetchStockData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      
      // Get all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, nama_produk, stok, stok_minimum, harga_beli, harga_jual')
        .order('nama_produk');

      if (productsError) throw productsError;

      // Get stock in during period
      const { data: stockInPeriod } = await supabase
        .from('stock_in')
        .select('product_id, qty')
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString());

      // Get stock out during period
      const { data: stockOutPeriod } = await supabase
        .from('stock_out')
        .select('product_id, qty')
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString());

      // Calculate stock movement per product
      const stockMovement = new Map<number, { in: number; out: number }>();
      
      stockInPeriod?.forEach(item => {
        if (item.product_id) {
          const current = stockMovement.get(item.product_id) || { in: 0, out: 0 };
          current.in += item.qty;
          stockMovement.set(item.product_id, current);
        }
      });

      stockOutPeriod?.forEach(item => {
        if (item.product_id) {
          const current = stockMovement.get(item.product_id) || { in: 0, out: 0 };
          current.out += item.qty;
          stockMovement.set(item.product_id, current);
        }
      });

      // Build stock data with period activity
      const stockDataWithActivity = (products || []).map(product => {
        const movement = stockMovement.get(product.id) || { in: 0, out: 0 };
        return {
          ...product,
          period_in: movement.in,
          period_out: movement.out,
          period_movement: movement.in - movement.out,
        };
      });

      setStockData(stockDataWithActivity as any);
      setShowStockDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Asset Data based on period
  const fetchAssetData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();

      // Get stock in value during period
      const { data: stockInData } = await supabase
        .from('stock_in')
        .select('total_harga')
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString());

      const assetIn = stockInData?.reduce((sum, item) => sum + item.total_harga, 0) || 0;

      // Get stock out value during period
      const { data: stockOutData } = await supabase
        .from('stock_out')
        .select('total_harga')
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString());

      const assetOut = stockOutData?.reduce((sum, item) => sum + item.total_harga, 0) || 0;

      // Net asset change during period
      const change = assetIn - assetOut;
      const changePercent = assetOut > 0 ? (change / assetOut) * 100 : 0;

      setAssetData({
        current: assetIn,
        previous: assetOut,
        change,
        changePercent,
      });
      setShowAssetDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Margin Data based on period (products sold during period)
  const fetchMarginData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates();

      // Get stock out with product details during period
      const { data: stockOutData, error } = await supabase
        .from('stock_out')
        .select(`
          qty,
          total_harga,
          product_id,
          products!inner(id, nama_produk, harga_beli, harga_jual)
        `)
        .gte('tanggal', startDate.toISOString())
        .lte('tanggal', endDate.toISOString())
        .not('product_id', 'is', null);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map<number, {
        nama_produk: string;
        harga_beli: number;
        harga_jual: number;
        qty_sold: number;
        revenue: number;
      }>();

      stockOutData?.forEach((item: any) => {
        const product = item.products;
        if (product) {
          const existing = productMap.get(product.id);
          if (existing) {
            existing.qty_sold += item.qty;
            existing.revenue += item.total_harga;
          } else {
            productMap.set(product.id, {
              nama_produk: product.nama_produk,
              harga_beli: product.harga_beli,
              harga_jual: product.harga_jual,
              qty_sold: item.qty,
              revenue: item.total_harga,
            });
          }
        }
      });

      // Calculate margins
      const margins: ProductMargin[] = Array.from(productMap.entries()).map(([id, data]) => {
        const margin = data.harga_jual - data.harga_beli;
        const margin_percent = data.harga_beli > 0 ? (margin / data.harga_beli) * 100 : 0;
        const actual_profit = data.revenue - (data.qty_sold * data.harga_beli);

        return {
          id,
          nama_produk: data.nama_produk,
          harga_beli: data.harga_beli,
          harga_jual: data.harga_jual,
          stok: data.qty_sold, // Using qty_sold as "stok" for this period
          margin,
          margin_percent,
          potential_profit: actual_profit, // Actual profit from sales in period
        };
      });

      setMarginData(margins.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk)));
      setShowMarginDialog(true);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Export PDF Functions
  const exportStockInPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Barang Masuk', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${getPeriodLabel()}`, 14, 22);

    const tableData = stockInData.map(item => [
      format(new Date(item.tanggal), 'dd/MM/yyyy'),
      item.products?.nama_produk || '-',
      item.suppliers?.nama_supplier || '-',
      item.qty.toString(),
      formatCurrency(item.total_harga),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Tanggal', 'Produk', 'Supplier', 'Qty', 'Total']],
      body: tableData,
    });

    doc.save(`Laporan_Barang_Masuk_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({ title: 'Berhasil', description: 'PDF berhasil diunduh' });
  };

  const exportStockOutPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Barang Keluar', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${getPeriodLabel()}`, 14, 22);

    const tableData = stockOutData.map(item => [
      format(new Date(item.tanggal), 'dd/MM/yyyy'),
      item.products?.nama_produk || '-',
      item.qty.toString(),
      formatCurrency(item.total_harga),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Tanggal', 'Produk', 'Qty', 'Total']],
      body: tableData,
    });

    doc.save(`Laporan_Barang_Keluar_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({ title: 'Berhasil', description: 'PDF berhasil diunduh' });
  };

  const exportStockPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Stok Barang', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 22);

    const tableData = stockData.map(item => [
      item.nama_produk,
      item.stok.toString(),
      item.stok_minimum.toString(),
      item.stok <= item.stok_minimum ? 'Low' : 'OK',
      formatCurrency(item.harga_beli),
      formatCurrency(item.stok * item.harga_beli),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Produk', 'Stok', 'Min', 'Status', 'Harga Beli', 'Nilai']],
      body: tableData,
    });

    doc.save(`Laporan_Stok_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({ title: 'Berhasil', description: 'PDF berhasil diunduh' });
  };

  const exportAssetPDF = () => {
    if (!assetData) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Nilai Aset', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 22);

    const tableData = [
      ['Nilai Aset Bulan Ini', formatCurrency(assetData.current)],
      ['Nilai Aset Bulan Lalu', formatCurrency(assetData.previous)],
      ['Perubahan', formatCurrency(assetData.change)],
      ['Perubahan (%)', `${assetData.changePercent.toFixed(2)}%`],
    ];

    autoTable(doc, {
      startY: 28,
      head: [['Keterangan', 'Nilai']],
      body: tableData,
    });

    doc.save(`Laporan_Nilai_Aset_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({ title: 'Berhasil', description: 'PDF berhasil diunduh' });
  };

  const exportMarginPDF = () => {
    const doc = new jsPDF('l'); // landscape
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Laporan Margin & Keuntungan', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`, 14, 22);

    const tableData = marginData.map(item => [
      item.nama_produk,
      formatCurrency(item.harga_beli),
      formatCurrency(item.harga_jual),
      formatCurrency(item.margin),
      `${item.margin_percent.toFixed(2)}%`,
      item.stok.toString(),
      formatCurrency(item.potential_profit),
    ]);

    autoTable(doc, {
      startY: 28,
      head: [['Produk', 'Harga Beli', 'Harga Jual', 'Margin', 'Margin %', 'Stok', 'Potensi Profit']],
      body: tableData,
    });

    doc.save(`Laporan_Margin_${format(new Date(), 'ddMMyyyy')}.pdf`);
    toast({ title: 'Berhasil', description: 'PDF berhasil diunduh' });
  };

  const reports = [
    {
      title: 'Laporan Barang Masuk',
      description: 'Total barang masuk per periode',
      icon: TrendingUp,
      color: 'text-success bg-success/10',
      viewAction: fetchStockInData,
      exportAction: () => {
        if (stockInData.length === 0) {
          fetchStockInData().then(() => setTimeout(exportStockInPDF, 500));
        } else {
          exportStockInPDF();
        }
      },
    },
    {
      title: 'Laporan Barang Keluar',
      description: 'Total barang keluar per periode',
      icon: TrendingDown,
      color: 'text-chart-2 bg-chart-2/10',
      viewAction: fetchStockOutData,
      exportAction: () => {
        if (stockOutData.length === 0) {
          fetchStockOutData().then(() => setTimeout(exportStockOutPDF, 500));
        } else {
          exportStockOutPDF();
        }
      },
    },
    {
      title: 'Laporan Stok Barang',
      description: 'Posisi stok saat ini',
      icon: Package,
      color: 'text-primary bg-primary/10',
      viewAction: fetchStockData,
      exportAction: () => {
        if (stockData.length === 0) {
          fetchStockData().then(() => setTimeout(exportStockPDF, 500));
        } else {
          exportStockPDF();
        }
      },
    },
    {
      title: 'Laporan Nilai Aset',
      description: 'Perbandingan aset bulan ini vs bulan lalu',
      icon: Wallet,
      color: 'text-chart-4 bg-chart-4/10',
      viewAction: fetchAssetData,
      exportAction: () => {
        if (!assetData) {
          fetchAssetData().then(() => setTimeout(exportAssetPDF, 500));
        } else {
          exportAssetPDF();
        }
      },
    },
    {
      title: 'Laporan Margin & Keuntungan',
      description: 'Analisis margin dan profit per produk',
      icon: FileText,
      color: 'text-chart-5 bg-chart-5/10',
      viewAction: fetchMarginData,
      exportAction: () => {
        if (marginData.length === 0) {
          fetchMarginData().then(() => setTimeout(exportMarginPDF, 500));
        } else {
          exportMarginPDF();
        }
      },
    },
  ];

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
                <span className="font-medium">Periode: {getPeriodLabel()}</span>
              </div>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Bulan Ini</SelectItem>
                  <SelectItem value="last">Bulan Lalu</SelectItem>
                  <SelectItem value="last3">3 Bulan Terakhir</SelectItem>
                </SelectContent>
              </Select>
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
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={report.viewAction}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4" />
                    Lihat
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={report.exportAction}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stock In Dialog */}
      <Dialog open={showStockInDialog} onOpenChange={setShowStockInDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Laporan Barang Masuk</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportStockInPDF}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockInData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{item.products?.nama_produk || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.suppliers?.nama_supplier || '-'}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.total_harga)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Out Dialog */}
      <Dialog open={showStockOutDialog} onOpenChange={setShowStockOutDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Laporan Barang Keluar</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportStockOutPDF}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockOutData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(item.tanggal), 'dd MMM yyyy', { locale: id })}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{item.products?.nama_produk || '-'}</TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.total_harga)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Current Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Laporan Stok Barang</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportStockPDF}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium whitespace-nowrap">{item.nama_produk}</TableCell>
                    <TableCell className="text-right">{item.stok}</TableCell>
                    <TableCell className="text-right">{item.stok_minimum}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                        item.stok <= item.stok_minimum ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                      }`}>
                        {item.stok <= item.stok_minimum ? 'Low' : 'OK'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.harga_beli)}</TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(item.stok * item.harga_beli)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Laporan Nilai Aset</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportAssetPDF}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          {assetData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Nilai Aset Bulan Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(assetData.current)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Nilai Aset Bulan Lalu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(assetData.previous)}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Perubahan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${assetData.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {assetData.change >= 0 ? '+' : ''}{formatCurrency(assetData.change)} ({assetData.changePercent.toFixed(2)}%)
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Margin Dialog */}
      <Dialog open={showMarginDialog} onOpenChange={setShowMarginDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Laporan Margin & Keuntungan</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportMarginPDF}>
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Potensi Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marginData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium whitespace-nowrap">{item.nama_produk}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.harga_beli)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.harga_jual)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={item.margin >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(item.margin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={item.margin_percent >= 0 ? 'text-success' : 'text-destructive'}>
                        {item.margin_percent.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{item.stok}</TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      <span className={item.potential_profit >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrency(item.potential_profit)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {marginData.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-secondary/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Potensi Profit</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(marginData.reduce((sum, p) => sum + p.potential_profit, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rata-rata Margin</p>
                  <p className="text-2xl font-bold text-primary">
                    {(marginData.reduce((sum, p) => sum + p.margin_percent, 0) / marginData.length).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Reports;
