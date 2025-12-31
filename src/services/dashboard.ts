import { supabase } from "@/lib/supabase";

export interface TopProduct {
  name: string;
  sold: number;
}

export interface StockFlow {
  month: string;
  masuk: number;
  keluar: number;
}

export const fetchTopProducts = async (): Promise<TopProduct[]> => {
  const { data, error } = await supabase.from("top_products").select("*");

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
};

export const fetchStockFlow = async (): Promise<StockFlow[]> => {
  const { data, error } = await supabase.rpc("stock_flow_per_month");

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
};
