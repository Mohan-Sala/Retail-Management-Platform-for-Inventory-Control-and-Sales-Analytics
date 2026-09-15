import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ShoppingCart, Info, Check, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inr, num } from "@/lib/format";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { WishlistButton } from "@/components/common/WishlistButton";

export const Route = createFileRoute("/customer/marketplace")({
  component: CustomerMarketplace,
});

function CustomerMarketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "12",
        q: search,
        sortBy,
      });
      if (category !== "all") {
        queryParams.append("category", category);
      }

      const res: any = await api.get(`/marketplace?${queryParams.toString()}`);
      setProducts(res.data?.products || []);
      setTotal(res.data?.total || 0);
      setPages(res.data?.pages || 1);
    } catch (e) {
      console.error("Failed to load marketplace products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, category, sortBy]);

  // Load categories list from products
  useEffect(() => {
    async function loadCategories() {
      try {
        const res: any = await api.get("/marketplace?limit=100");
        const list: string[] = res.data?.products?.map((p: any) => p.category) || [];
        setCategories(["all", ...Array.from(new Set(list))]);
      } catch (e) {
        console.error("Failed to compile categories list:", e);
      }
    }
    loadCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await api.post("/cart", { productId, quantity: 1 });
      toast({
        title: "Added to Cart",
        description: "Your product has been added to your shopping cart.",
      });
    } catch (e: any) {
      toast({
        title: "Cart Error",
        description: e.response?.data?.message || "Failed to add product to cart.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Catalog"
        description="Browse high-quality products sourced directly from verified multi-vendor partners."
      />

      {/* Filter Toolbar */}
      <Card className="p-4 border border-border/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Category:</span>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-background border border-border rounded px-2 py-1 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-background border border-border rounded px-2 py-1 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="salesDesc">Top Selling</option>
              <option value="nameAsc">A-Z Name</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid List */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Retrieving products catalog...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden border border-border/60 flex flex-col justify-between group hover:shadow-lg transition-shadow">
              <div className="relative">
                <img src={p.image} alt={p.name} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2">
                  <WishlistButton productId={p._id} />
                </div>
                <span className={`absolute top-2 right-2 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded ${p.stock <= 5 ? "bg-destructive/90 text-destructive-foreground" : "bg-primary/95 text-primary-foreground"}`}>
                  {p.stock <= 5 ? `${p.stock} Left` : "In Stock"}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{p.category}</span>
                  <h4 className="font-semibold text-sm line-clamp-1 mt-0.5">{p.name}</h4>
                  <div className="text-[11px] text-muted-foreground mt-1">Shop: {p.vendorShopName}</div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-3">
                  <div className="text-base font-bold text-foreground font-mono">{inr(p.price)}</div>
                  <Button size="sm" onClick={() => handleAddToCart(p._id)} className="h-8 gap-1.5 px-3">
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <span>No matching products found. Try adjusting your query or filters.</span>
            </div>
          )}
        </div>
      )}

      {/* Pagination controls */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="text-xs self-center px-4">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
