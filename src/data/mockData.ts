import { Product, Supplier, Bundle, StockIn, StockOut, ActivityLog, DashboardMetrics } from '@/types/inventory';

export const mockSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'PT Snack Indonesia', contact: '021-12345678', address: 'Jakarta Pusat', createdAt: new Date('2024-01-01') },
  { id: 'sup-2', name: 'CV Makanan Ringan', contact: '022-87654321', address: 'Bandung', createdAt: new Date('2024-01-15') },
  { id: 'sup-3', name: 'UD Jaya Snack', contact: '031-11223344', address: 'Surabaya', createdAt: new Date('2024-02-01') },
];

export const mockProducts: Product[] = [
  { id: 'prod-1', name: 'Taro', category: 'Snack', unit: 'pcs', supplierId: 'sup-1', buyPrice: 3000, sellPrice: 5000, stock: 150, minStock: 50, avgBuyPrice: 3000, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-2', name: 'Krisbee', category: 'Snack', unit: 'pcs', supplierId: 'sup-1', buyPrice: 2500, sellPrice: 4500, stock: 200, minStock: 50, avgBuyPrice: 2500, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-3', name: 'Sponge', category: 'Snack', unit: 'pcs', supplierId: 'sup-2', buyPrice: 2800, sellPrice: 4800, stock: 30, minStock: 40, avgBuyPrice: 2800, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-4', name: 'Better', category: 'Snack', unit: 'pcs', supplierId: 'sup-2', buyPrice: 3200, sellPrice: 5500, stock: 180, minStock: 50, avgBuyPrice: 3200, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-5', name: 'Nabati', category: 'Wafer', unit: 'pcs', supplierId: 'sup-1', buyPrice: 2000, sellPrice: 3500, stock: 250, minStock: 60, avgBuyPrice: 2000, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-6', name: 'Hello Panda', category: 'Biskuit', unit: 'pcs', supplierId: 'sup-3', buyPrice: 8000, sellPrice: 12000, stock: 15, minStock: 30, avgBuyPrice: 8000, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-7', name: 'Nextar', category: 'Biskuit', unit: 'pcs', supplierId: 'sup-2', buyPrice: 4000, sellPrice: 6500, stock: 120, minStock: 40, avgBuyPrice: 4000, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-8', name: 'Toppo', category: 'Biskuit', unit: 'pcs', supplierId: 'sup-3', buyPrice: 7500, sellPrice: 11000, stock: 80, minStock: 30, avgBuyPrice: 7500, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-9', name: 'Pillow', category: 'Snack', unit: 'pcs', supplierId: 'sup-1', buyPrice: 3500, sellPrice: 5500, stock: 100, minStock: 40, avgBuyPrice: 3500, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
  { id: 'prod-10', name: 'Milkita', category: 'Permen', unit: 'pcs', supplierId: 'sup-2', buyPrice: 1500, sellPrice: 2500, stock: 300, minStock: 80, avgBuyPrice: 1500, createdAt: new Date('2024-01-01'), updatedAt: new Date() },
];

export const mockBundles: Bundle[] = [
  {
    id: 'bun-1',
    name: 'Goodiebag Isi 5',
    category: 'goodiebag',
    items: [
      { productId: 'prod-1', quantity: 1 }, // Taro
      { productId: 'prod-2', quantity: 1 }, // Krisbee
      { productId: 'prod-3', quantity: 1 }, // Sponge
      { productId: 'prod-5', quantity: 1 }, // Nabati
      { productId: 'prod-4', quantity: 1 }, // Better
    ],
    sellPrice: 25000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'bun-2',
    name: 'Goodiebag Isi 7',
    category: 'goodiebag',
    items: [
      { productId: 'prod-5', quantity: 1 }, // Nabati
      { productId: 'prod-1', quantity: 1 }, // Taro
      { productId: 'prod-2', quantity: 1 }, // Krisbee
      { productId: 'prod-3', quantity: 1 }, // Sponge
      { productId: 'prod-4', quantity: 1 }, // Better
      { productId: 'prod-10', quantity: 1 }, // Milkita
      { productId: 'prod-6', quantity: 1 }, // Hello Panda
    ],
    sellPrice: 45000,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
  },
  {
    id: 'bun-3',
    name: 'Goodiebag Isi 10',
    category: 'goodiebag',
    items: [
      { productId: 'prod-5', quantity: 2 }, // Nabati x2
      { productId: 'prod-1', quantity: 1 }, // Taro
      { productId: 'prod-2', quantity: 1 }, // Krisbee
      { productId: 'prod-3', quantity: 1 }, // Sponge
      { productId: 'prod-6', quantity: 1 }, // Hello Panda
      { productId: 'prod-9', quantity: 1 }, // Pillow
      { productId: 'prod-10', quantity: 1 }, // Milkita
      { productId: 'prod-4', quantity: 1 }, // Better
      { productId: 'prod-7', quantity: 1 }, // Nextar
      { productId: 'prod-8', quantity: 1 }, // Toppo
    ],
    sellPrice: 75000,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

export const mockStockIn: StockIn[] = [
  { id: 'sin-1', productId: 'prod-1', supplierId: 'sup-1', quantity: 100, buyPrice: 3000, totalPrice: 300000, date: new Date('2024-12-01'), notes: 'Restok bulanan', createdBy: 'Admin' },
  { id: 'sin-2', productId: 'prod-5', supplierId: 'sup-1', quantity: 150, buyPrice: 2000, totalPrice: 300000, date: new Date('2024-12-05'), notes: 'Restok bulanan', createdBy: 'Admin' },
  { id: 'sin-3', productId: 'prod-6', supplierId: 'sup-3', quantity: 50, buyPrice: 8000, totalPrice: 400000, date: new Date('2024-12-10'), notes: 'Stok baru', createdBy: 'Gudang' },
];

export const mockStockOut: StockOut[] = [
  { id: 'sout-1', type: 'bundle', itemId: 'bun-1', quantity: 20, sellPrice: 25000, totalPrice: 500000, additionalCost: 10000, margin: 150000, date: new Date('2024-12-15'), notes: 'Penjualan event', createdBy: 'Admin' },
  { id: 'sout-2', type: 'product', itemId: 'prod-1', quantity: 30, sellPrice: 5000, totalPrice: 150000, additionalCost: 0, margin: 60000, date: new Date('2024-12-18'), notes: 'Penjualan retail', createdBy: 'Gudang' },
  { id: 'sout-3', type: 'bundle', itemId: 'bun-3', quantity: 10, sellPrice: 75000, totalPrice: 750000, additionalCost: 20000, margin: 280000, date: new Date('2024-12-20'), notes: 'Order corporate', createdBy: 'Admin' },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log-1', type: 'stock_in', description: 'Barang masuk: Taro (100 pcs)', userId: 'usr-1', userName: 'Admin', timestamp: new Date('2024-12-20T10:30:00') },
  { id: 'log-2', type: 'stock_out', description: 'Penjualan: Goodiebag Isi 10 (10 pcs)', userId: 'usr-1', userName: 'Admin', timestamp: new Date('2024-12-20T11:15:00') },
  { id: 'log-3', type: 'adjustment', description: 'Penyesuaian stok: Hello Panda -5 (barang rusak)', userId: 'usr-2', userName: 'Gudang', timestamp: new Date('2024-12-20T14:00:00') },
  { id: 'log-4', type: 'price_change', description: 'Perubahan harga: Nabati Rp3.500 → Rp3.800', userId: 'usr-1', userName: 'Admin', timestamp: new Date('2024-12-19T09:00:00') },
  { id: 'log-5', type: 'bundle_create', description: 'Bundle baru: Hampers Premium', userId: 'usr-1', userName: 'Admin', timestamp: new Date('2024-12-18T16:30:00') },
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalProducts: 10,
  totalStock: 1425,
  totalAssetValue: 4875000,
  lowStockCount: 2,
  monthlyStockIn: 300,
  monthlyStockOut: 180,
  monthlyRevenue: 1400000,
  monthlyProfit: 490000,
};

export const mockChartData = {
  stockFlow: [
    { month: 'Jul', masuk: 450, keluar: 320 },
    { month: 'Agu', masuk: 520, keluar: 410 },
    { month: 'Sep', masuk: 380, keluar: 350 },
    { month: 'Okt', masuk: 600, keluar: 480 },
    { month: 'Nov', masuk: 550, keluar: 520 },
    { month: 'Des', masuk: 480, keluar: 380 },
  ],
  assetValue: [
    { month: 'Jul', value: 3800000 },
    { month: 'Agu', value: 4200000 },
    { month: 'Sep', value: 3950000 },
    { month: 'Okt', value: 4600000 },
    { month: 'Nov', value: 4400000 },
    { month: 'Des', value: 4875000 },
  ],
  topProducts: [
    { name: 'Nabati', sold: 320 },
    { name: 'Taro', sold: 280 },
    { name: 'Krisbee', sold: 250 },
    { name: 'Milkita', sold: 220 },
    { name: 'Better', sold: 180 },
  ],
};
