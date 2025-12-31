import { MainLayout } from '@/components/layout/MainLayout';
import { BundlesGrid } from '@/components/bundles/BundlesGrid';

const Bundles = () => {
  return (
    <MainLayout 
      title="Bundling" 
      subtitle="Kelola paket bundling dan hampers"
    >
      <BundlesGrid />
    </MainLayout>
  );
};

export default Bundles;
