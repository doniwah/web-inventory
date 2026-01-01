import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Box, 
  Package, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Package,
      title: 'Manajemen Produk',
      description: 'Kelola produk dan bundling dengan mudah dan efisien',
    },
    {
      icon: TrendingUp,
      title: 'Tracking Stok Real-time',
      description: 'Pantau stok masuk dan keluar secara real-time',
    },
    {
      icon: BarChart3,
      title: 'Laporan Lengkap',
      description: 'Analisis bisnis dengan laporan yang komprehensif',
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Kontrol akses dengan sistem role yang fleksibel',
    },
    {
      icon: Zap,
      title: 'Notifikasi Otomatis',
      description: 'Dapatkan alert untuk stok menipis secara otomatis',
    },
    {
      icon: CheckCircle2,
      title: 'Mudah Digunakan',
      description: 'Interface yang intuitif dan user-friendly',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <Box className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">StokPro</h1>
              <p className="text-xs text-muted-foreground">Inventory System</p>
            </div>
          </div>
          <Link to="/login">
            <Button className="gradient-primary text-primary-foreground border-0 shadow-glow">
              Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Sistem Inventory Modern
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Kelola Inventory Bisnis Anda dengan{' '}
            <span className="gradient-text">Lebih Mudah</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            StokPro membantu Anda mengelola stok, produk, dan laporan bisnis secara real-time dengan interface yang modern dan mudah digunakan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/login">
              <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-glow text-lg px-8">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">100%</div>
              <div className="text-sm text-muted-foreground mt-1">Real-time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">Akses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">∞</div>
              <div className="text-sm text-muted-foreground mt-1">Produk</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30 rounded-3xl">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola inventory bisnis dalam satu platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Siap Meningkatkan Efisiensi Bisnis Anda?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Bergabunglah dengan StokPro dan rasakan kemudahan mengelola inventory dengan sistem yang modern dan powerful.
          </p>
          <Link to="/login">
            <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-glow text-lg px-8">
              Login Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/30 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                <Box className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">StokPro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 StokPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
