import { MainLayout } from '@/components/layout/MainLayout';
import { ActivityHistory } from '@/components/history/ActivityHistory';

const History = () => {
  return (
    <MainLayout 
      title="Riwayat Aktivitas" 
      subtitle="Log semua aktivitas sistem"
    >
      <ActivityHistory />
    </MainLayout>
  );
};

export default History;
