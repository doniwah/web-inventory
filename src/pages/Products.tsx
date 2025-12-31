import { MainLayout } from '@/components/layout/MainLayout';
import { ProductsTable } from '@/components/products/ProductsTable';

const Products = () => {
  return (
    <MainLayout 
      title="Produk" 
      subtitle="Kelola master data produk Anda"
    >
      <ProductsTable />
    </MainLayout>
  );
};

export default Products;
