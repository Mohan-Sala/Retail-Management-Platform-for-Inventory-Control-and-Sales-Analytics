import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/customer/checkout")({
  component: CustomerCheckout,
});

import { CouponSelector } from "@/components/common/CouponSelector";

function CustomerCheckout() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [loyaltyAccount, setLoyaltyAccount] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    async function loadCheckoutData() {
      try {
        setLoading(true);
        const [cartRes, loyaltyRes] = await Promise.all([
          api.get("/cart"),
          api.get("/loyalty").catch(() => ({ data: null })),
        ]);
        setCart(cartRes.data || { items: [] });
        setLoyaltyAccount(loyaltyRes.data);
      } catch (e) {
        console.error("Failed to load checkout cart or loyalty data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCheckoutData();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post("/orders/checkout", {
        idempotencyKey,
        shippingAddress: {
          fullName: user?.name || "Customer",
          phone: user?.phone || "0000000000",
          addressLine1: "Default Address",
          addressLine2: "",
          city: "Default City",
          state: "Default State",
          postalCode: "000000",
          country: "India",
        },
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      });

      toast({
        title: "Order Placed",
        description: "Your checkout transaction completed successfully!",
      });
      
      navigate({ to: "/customer/orders" });
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        description: err.response?.data?.message || "Failed to process checkout transaction.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const items = cart?.items || [];
  const itemsSubtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  const finalSubtotal = Math.max(0, itemsSubtotal - couponDiscount - pointsToRedeem);
  const tax = parseFloat((finalSubtotal * 0.05).toFixed(2));
  const total = finalSubtotal + tax;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Preparing checkout session...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Your cart is empty. Please add items to checkout.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout Secure Transaction"
        description="Provide your delivery details and choose your payment method."
      />

      <form onSubmit={handlePlaceOrder} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Payment Method Option */}
          <Card className="p-5 border border-border/60 space-y-4">
            <h3 className="text-sm font-semibold border-b border-border/40 pb-3">Payment Option</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border border-border/60 rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/40 flex-1">
                <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} />
                <div className="text-xs font-semibold">Cash On Delivery (COD)</div>
              </label>
              <label className="flex items-center gap-2 border border-border/60 rounded-lg px-4 py-3 cursor-pointer hover:bg-muted/40 flex-1">
                <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={(e) => setPaymentMethod(e.target.value)} />
                <div className="text-xs font-semibold">Prepaid (Card / UPI)</div>
              </label>
            </div>
          </Card>
        </div>

        {/* Totals Summary Card */}
        <Card className="p-5 border border-border/60 flex flex-col justify-between h-fit space-y-4">
          <div>
            <h3 className="text-sm font-semibold border-b border-border/40 pb-3">Order Checkout</h3>
            <div className="divide-y divide-border/40 max-h-60 overflow-y-auto mt-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between py-2 text-xs">
                  <div className="truncate max-w-[150px]">
                    <span className="font-semibold">{item.productId?.name}</span>
                    <span className="text-muted-foreground block text-[10px]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-mono self-center">{inr(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-border/40">
            <CouponSelector
              appliedCoupon={appliedCoupon}
              onCouponApplied={(code, discount) => {
                setAppliedCoupon(code);
                setCouponDiscount(discount);
              }}
              onCouponRemoved={() => {
                setAppliedCoupon(null);
                setCouponDiscount(0);
              }}
            />

            {loyaltyAccount && loyaltyAccount.availablePoints > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Redeem Loyalty Points (Available: {loyaltyAccount.availablePoints})
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={loyaltyAccount.availablePoints}
                    value={pointsToRedeem || ""}
                    onChange={(e) => {
                      const val = Math.min(
                        loyaltyAccount.availablePoints,
                        Math.max(0, parseInt(e.target.value) || 0)
                      );
                      setPointsToRedeem(val);
                    }}
                    placeholder="Enter points value"
                    className="text-xs"
                    disabled={submitting}
                  />
                  {pointsToRedeem > 0 && (
                    <Button variant="outline" size="sm" type="button" onClick={() => setPointsToRedeem(0)}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Total</span>
              <span className="font-mono">{inr(itemsSubtotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Coupon Discount</span>
                <span className="font-mono">-{inr(couponDiscount)}</span>
              </div>
            )}
            {pointsToRedeem > 0 && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Loyalty Points Applied</span>
                <span className="font-mono">-{inr(pointsToRedeem)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Tax (5%)</span>
              <span className="font-mono">{inr(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-border/40 pt-3">
              <span>Total Price</span>
              <span className="font-mono text-primary">{inr(total)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={submitting}>
            {submitting ? "Placing Order..." : "Place Order"}
          </Button>
        </Card>
      </form>
    </div>
  );
}
