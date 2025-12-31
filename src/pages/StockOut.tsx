import { MainLayout } from '@/components/layout/MainLayout';
import { StockOutForm } from '@/components/stock/StockOutForm';

const StockOut = () => {
  return (
    <MainLayout 
      title="Barang Keluar" 
      subtitle="Catat penjualan atau distribusi barang"
    >
      <StockOutForm />
    </MainLayout>
  );
};

export default StockOut;
