import { MainLayout } from '@/components/layout/MainLayout';
import { StockInForm } from '@/components/stock/StockInForm';

const StockIn = () => {
  return (
    <MainLayout 
      title="Barang Masuk" 
      subtitle="Input stok barang baru ke gudang"
    >
      <StockInForm />
    </MainLayout>
  );
};

export default StockIn;
