import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ShoppingCart, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/customer/wishlist")({
  component: CustomerWishlist,
});

function CustomerWishlist() {
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/wishlist");
      setWishlist(res.data || { items: [] });
    } catch (e) {
      console.error("Failed to load wishlist:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleMoveToCart = async (productId: string) => {
    try {
      const res: any = await api.post("/wishlist/move-to-cart", { productId });
      setWishlist(res.data);
      toast({
        title: "Moved to Cart",
        description: "Product moved from wishlist to your shopping cart.",
      });
    } catch (e: any) {
      toast({
        title: "Error moving item",
        description: e.response?.data?.message || "Failed to transfer item to cart.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res: any = await api.delete(`/wishlist/${productId}`);
      setWishlist(res.data);
      toast({
        title: "Removed from Wishlist",
      });
    } catch (e) {
      toast({
        title: "Removal Error",
        variant: "destructive",
      });
    }
  };

  const handleClear = async () => {
    try {
      const res: any = await api.delete("/wishlist");
      setWishlist(res.data);
      toast({
        title: "Wishlist Cleared",
      });
    } catch (e) {
      toast({
        title: "Error clearing wishlist",
        variant: "destructive",
      });
    }
  };

  const items = wishlist?.items || [];

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Retrieving wishlist items...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Saved Wishlist"
        description="Review products you've saved. Move them directly to your cart or remove them at any time."
      />

      {items.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-lg border-border/60">
          <Heart className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
          <h4 className="font-semibold text-sm">Your Wishlist is Empty</h4>
          <p className="text-xs text-muted-foreground mt-1">Browse the marketplace and heart items to save them here.</p>
          <Button className="mt-4" asChild>
            <Link to="/customer/marketplace">Explore Marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Showing {items.length} saved items</span>
            <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive hover:bg-destructive/10">
              Clear All
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item: any) => {
              const p = item.productId;
              if (!p) return null;
              return (
                <Card key={p._id} className="overflow-hidden border border-border/60 flex flex-col justify-between group hover:shadow-lg transition-all">
                  <div className="relative">
                    <img src={p.image} alt={p.name} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(p._id)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-destructive/10 hover:text-destructive shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{p.category}</span>
                      <h4 className="font-semibold text-sm line-clamp-1 mt-0.5">{p.name}</h4>
                      <div className="text-[11px] font-mono font-bold text-primary mt-1">{inr(p.price)}</div>
                    </div>

                    <div className="border-t border-border/40 pt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMoveToCart(p._id)}
                        className="flex-1 gap-1.5 h-8 text-xs"
                        disabled={p.stock <= 0 || !p.isActive}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Move to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
