import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

type LowStockProduct = {
  id: number;
  nama_produk: string;
  stok: number;
  stok_minimum: number;
};

export function LowStockAlert() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data, error } = await supabase.from("products").select("id, nama_produk, stok, stok_minimum").lte("stok", supabase.raw("stok_minimum")); // stok <= stok_minimum

      if (error) {
        console.error("Gagal ambil data stok menipis:", error);
      } else {
        setProducts(data ?? []);
      }

      setLoading(false);
    };

    fetchLowStock();
  }, []);

  if (loading) return null;
  if (products.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
          <AlertTriangle className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Stok Menipis</h3>
          <p className="text-sm text-muted-foreground">{products.length} produk perlu restok</p>
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const percentage = product.stok_minimum === 0 ? 0 : (product.stok / product.stok_minimum) * 100;

          const isKritis = product.stok < product.stok_minimum;

          return (
            <div key={product.id} className="rounded-lg bg-background/50 p-3 transition-colors hover:bg-background/80">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-foreground">{product.nama_produk}</span>
                <span className={cn("text-sm font-semibold", isKritis ? "text-destructive" : "text-warning")}>
                  {product.stok} / {product.stok_minimum} pcs
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className={cn("h-full rounded-full transition-all", isKritis ? "bg-destructive" : "bg-warning")} style={{ width: `${Math.min(percentage, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
