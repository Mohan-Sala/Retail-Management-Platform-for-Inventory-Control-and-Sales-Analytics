import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/customer/cart")({
  component: CustomerCart,
});

function CustomerCart() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCart = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/cart");
      setCart(res.data || { items: [] });
    } catch (e) {
      console.error("Failed to load cart:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQty = async (productId: string, currentQty: number, offset: number) => {
    const target = currentQty + offset;
    if (target < 1) {
      return handleRemoveItem(productId);
    }
    try {
      const res: any = await api.put("/cart", { productId, quantity: target });
      setCart(res.data);
      toast({ title: "Quantity Updated" });
    } catch (e: any) {
      toast({
        title: "Quantity Error",
        description: e.response?.data?.message || "Failed to update item quantity.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      const res: any = await api.delete(`/cart/${productId}`);
      setCart(res.data);
      toast({ title: "Item Removed", description: "Product has been removed from your cart." });
    } catch (e) {
      toast({ title: "Removal Error", variant: "destructive" });
    }
  };

  const handleClearCart = async () => {
    try {
      const res: any = await api.delete("/cart");
      setCart(res.data);
      toast({ title: "Cart Cleared" });
    } catch (e) {
      toast({ title: "Error clearing cart", variant: "destructive" });
    }
  };

  const items = cart?.items || [];
  const itemsSubtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const tax = parseFloat((itemsSubtotal * 0.05).toFixed(2));
  const total = itemsSubtotal + tax;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading shopping cart...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Shopping Cart"
        description="Verify your item choices, adjust quantities, and prepare for checkout."
      />

      {items.length === 0 ? (
        <div className="py-16 text-center border border-dashed rounded-lg border-border/60">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
          <h4 className="font-semibold text-sm">Your Cart is Empty</h4>
          <p className="text-xs text-muted-foreground mt-1">Add items from the marketplace to check out.</p>
          <Button className="mt-4" asChild>
            <Link to="/customer/marketplace">Browse Catalog</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item: any) => (
              <Card key={item.productId?._id} className="p-4 border border-border/60 flex items-center justify-between gap-4">
                <img src={item.productId?.image || "https://picsum.photos/seed/default/100/100"} alt="" className="h-16 w-16 object-cover rounded-md" />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.productId?.name || "Product Name"}</h4>
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{inr(item.priceAtAddition)} per unit</div>
                </div>

                <div className="flex items-center gap-2 border border-border/60 rounded-lg p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleUpdateQty(item.productId?._id, item.quantity, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs px-2 font-mono font-semibold">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleUpdateQty(item.productId?._id, item.quantity, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-bold font-mono">{inr(item.subtotal)}</div>
                </div>

                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId?._id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={handleClearCart} className="text-destructive hover:bg-destructive/10">
                Clear Cart
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/customer/marketplace">Continue Shopping</Link>
              </Button>
            </div>
          </div>

          {/* Cart totals summary */}
          <Card className="p-5 border border-border/60 flex flex-col justify-between h-fit space-y-4">
            <h3 className="text-sm font-semibold border-b border-border/40 pb-3">Order Summary</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{inr(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Tax (5%)</span>
                <span className="font-mono">{inr(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-border/40 pt-3">
                <span>Grand Total</span>
                <span className="font-mono text-primary">{inr(total)}</span>
              </div>
            </div>

            <Button className="w-full gap-1.5 mt-2" asChild>
              <Link to="/customer/checkout">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
