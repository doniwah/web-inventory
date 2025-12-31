export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  supplierId: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  avgBuyPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  createdAt: Date;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export interface BundleItem {
  productId: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  name: string;
  category: 'hampers' | 'goodiebag';
  items: BundleItem[];
  sellPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockIn {
  id: string;
  productId: string;
  supplierId: string;
  quantity: number;
  buyPrice: number;
  totalPrice: number;
  date: Date;
  notes: string;
  createdBy: string;
}

export interface StockOut {
  id: string;
  type: 'product' | 'bundle';
  itemId: string;
  quantity: number;
  sellPrice: number;
  totalPrice: number;
  additionalCost: number;
  margin: number;
  date: Date;
  notes: string;
  createdBy: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  previousStock: number;
  newStock: number;
  reason: string;
  date: Date;
  createdBy: string;
}

export interface ActivityLog {
  id: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'price_change' | 'product_create' | 'bundle_create';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gudang' | 'owner';
  createdAt: Date;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  totalAssetValue: number;
  lowStockCount: number;
  monthlyStockIn: number;
  monthlyStockOut: number;
  monthlyRevenue: number;
  monthlyProfit: number;
}
