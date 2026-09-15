import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Star, Search, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WishlistButton } from "@/components/common/WishlistButton";
import { inr } from "@/lib/format";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/customer/dashboard")({
  head: () => ({ meta: [{ title: "Marketplace Homepage · ShopSense" }] }),
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Marketplace states
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [vendorId, setVendorId] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  // Dialog / Modal states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "15",
        q: search,
        sortBy,
      });
      if (category !== "all") {
        queryParams.append("category", category);
      }
      if (vendorId !== "all") {
        queryParams.append("vendorId", vendorId);
      }

      const res: any = await api.get(`/marketplace?${queryParams.toString()}`);
      setProducts(res.data?.products || []);
      setTotal(res.data?.total || 0);
      setPages(res.data?.pages || 1);
    } catch (e) {
      console.error("Failed to load marketplace catalog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, category, vendorId, sortBy]);

  // Load categories and vendors list on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [catRes, vendorRes] = await Promise.all([
          api.get("/marketplace?limit=100").catch(() => ({ data: { products: [] } })),
          api.get("/vendors?limit=100").catch(() => ({ data: { vendors: [] } })),
        ]);

        const catList: string[] = catRes.data?.products?.map((p: any) => p.category) || [];
        setCategories(["all", ...Array.from(new Set(catList))]);
        setVendors(vendorRes?.data?.vendors || []);
      } catch (e) {
        console.error("Failed to load filtering options:", e);
      }
    }
    loadFilterOptions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleOpenDetails = async (product: any) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
    setLoadingModal(true);
    try {
      const [reviewsRes, relatedRes] = await Promise.all([
        api.get(`/reviews/product/${product._id}`).catch(() => ({ data: [] })),
        api.get(`/marketplace?category=${product.category}&limit=6`).catch(() => ({ data: { products: [] } })),
      ]);
      setReviews(reviewsRes?.data || []);
      const otherProducts = (relatedRes?.data?.products || []).filter((p: any) => p._id !== product._id);
      setRelatedProducts(otherProducts.slice(0, 4));
    } catch (e) {
      console.error("Failed to load details modal information:", e);
    } finally {
      setLoadingModal(false);
    }
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

  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= floor ? "text-amber-500 font-bold" : "text-muted-foreground/30"}>
          ★
        </span>
      );
    }
    return <span className="flex items-center text-xs">{stars}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border border-border/40 p-6 md:p-10">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> ShopSense Deals
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Hello, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Explore top picks and exclusive offers from verified local vendors in one centralized catalog.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,var(--primary-color)_0%,transparent_60%)] opacity-20 pointer-events-none" />
      </div>

      {/* Toolbar / Search / Filter / Sort */}
      <Card className="p-4 border border-border/60">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full lg:max-w-md flex gap-2">
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
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center justify-between lg:justify-end">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Category:</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-border rounded px-2.5 py-1.5 focus:outline-none text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Vendor:</span>
              <select
                value={vendorId}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-border rounded px-2.5 py-1.5 focus:outline-none text-xs"
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.businessName}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="bg-background border border-border rounded px-2.5 py-1.5 focus:outline-none text-xs"
              >
                <option value="newest">Latest Products</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="ratingDesc">Top Rated</option>
                <option value="nameAsc">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Marketplace Catalog list */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading products catalog...</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <Card key={p._id} className="overflow-hidden border border-border/60 flex flex-col justify-between group hover:shadow-lg transition-all duration-300 bg-card hover:-translate-y-1">
              <div className="relative overflow-hidden aspect-square bg-muted/20">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => handleOpenDetails(p)}
                />
                <div className="absolute top-2 left-2">
                  <WishlistButton productId={p._id} />
                </div>
                <span className={`absolute top-2 right-2 text-[9px] uppercase font-extrabold px-2 py-0.5 rounded shadow ${
                  p.stock === 0 ? "bg-muted text-muted-foreground" : p.stock <= 5 ? "bg-destructive text-destructive-foreground" : "bg-emerald-500 text-white"
                }`}>
                  {p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? `Only ${p.stock} Left!` : "In Stock"}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">{p.category}</span>
                  <h4
                    className="font-bold text-sm line-clamp-1 hover:text-primary cursor-pointer transition-colors"
                    onClick={() => handleOpenDetails(p)}
                  >
                    {p.name}
                  </h4>
                  <div className="text-[10px] text-muted-foreground">Shop: <span className="font-semibold">{p.vendorShopName}</span></div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                    {renderStars(p.averageRating)}
                    <span className="text-muted-foreground ml-1">({p.reviewCount || 0})</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-base font-bold text-foreground font-mono">{inr(p.price)}</div>
                    <Button size="xs" onClick={() => handleAddToCart(p._id)} className="h-7 gap-1 px-2.5 text-xs" disabled={p.stock === 0}>
                      <ShoppingCart className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => handleOpenDetails(p)} className="w-full text-[10px] h-7">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <span>No products found matching filters.</span>
            </div>
          )}
        </div>
      )}

      {/* Pagination controls */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="text-xs self-center px-4">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Product Details Dialog Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl overflow-hidden aspect-square bg-muted/10 border border-border/40 flex items-center justify-center">
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="max-h-full max-w-full object-contain" />
                </div>

                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                        {selectedProduct.category}
                      </span>
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded shadow ${
                        selectedProduct.stock === 0 ? "bg-muted text-muted-foreground" : selectedProduct.stock <= 5 ? "bg-destructive text-destructive-foreground" : "bg-emerald-500 text-white"
                      }`}>
                        {selectedProduct.stock === 0 ? "Out of Stock" : selectedProduct.stock <= 5 ? `Only ${selectedProduct.stock} Left!` : "In Stock"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">{selectedProduct.name}</h2>
                    <div className="text-xs text-muted-foreground">
                      Shop: <span className="font-semibold text-foreground">{selectedProduct.vendorShopName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-500">
                      {renderStars(selectedProduct.averageRating)}
                      <span className="text-muted-foreground">({selectedProduct.reviewCount || 0} customer reviews)</span>
                    </div>

                    <div className="text-2xl font-black font-mono text-primary pt-2">
                      {inr(selectedProduct.price)}
                    </div>

                    <div className="space-y-1 pt-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Description</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedProduct.description || "No product description provided by the vendor."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border/40">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleAddToCart(selectedProduct._id)}
                      disabled={selectedProduct.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </Button>
                    <div className="border border-border rounded-lg p-2 flex items-center justify-center bg-card hover:bg-muted/10 transition-colors">
                      <WishlistButton productId={selectedProduct._id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="border-t border-border/40 pt-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">You might also like</h4>
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    {relatedProducts.map((p) => (
                      <div
                        key={p._id}
                        className="p-2 border border-border/40 rounded-lg hover:shadow-md transition-all cursor-pointer space-y-1 bg-card group hover:-translate-y-0.5"
                        onClick={() => handleOpenDetails(p)}
                      >
                        <div className="aspect-square rounded overflow-hidden bg-muted/20">
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h5 className="text-[11px] font-semibold truncate group-hover:text-primary transition-colors">{p.name}</h5>
                        <div className="text-[11px] font-bold font-mono">{inr(p.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="border-t border-border/40 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Reviews</h4>
                <div className="space-y-3">
                  {loadingModal ? (
                    <div className="text-xs text-muted-foreground">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    reviews.map((r: any) => (
                      <div key={r._id} className="p-3 bg-muted/10 rounded-lg border border-border/30 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{r.customerId?.name || "Verified Customer"}</span>
                            {r.isVerifiedPurchase && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-amber-500 flex items-center gap-1">
                          {renderStars(r.rating)}
                          <span className="text-muted-foreground font-semibold ml-1">{r.rating} / 5</span>
                        </div>
                        {r.comment && <p className="text-muted-foreground text-xs leading-normal">{r.comment}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground italic">No reviews yet for this product. Be the first to buy and review it!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
