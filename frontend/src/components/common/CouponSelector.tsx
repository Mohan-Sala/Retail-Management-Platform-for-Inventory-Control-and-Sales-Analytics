import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Ticket } from "lucide-react";
import api from "@/lib/api";

interface CouponSelectorProps {
  onCouponApplied: (couponCode: string, discountAmount: number) => void;
  appliedCoupon: string | null;
  onCouponRemoved: () => void;
}

export function CouponSelector({
  onCouponApplied,
  appliedCoupon,
  onCouponRemoved,
}: CouponSelectorProps) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [inputCode, setInputCode] = useState("");
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const loadCoupons = async () => {
    try {
      const res: any = await api.get("/coupons");
      setCoupons(res.data || []);
    } catch (e) {
      console.error("Failed to load coupons:", e);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) return;

    try {
      setValidating(true);
      const res: any = await api.post("/coupons/validate", { code: codeToApply.toUpperCase() });
      if (res.data && res.data.isValid) {
        onCouponApplied(res.data.code, res.data.discountAmount);
        toast({ title: "Coupon Applied!", description: `Discount value of ${res.data.discountAmount} applied.` });
      }
    } catch (err: any) {
      toast({
        title: "Coupon Error",
        description: err.response?.data?.message || "Invalid coupon code.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-4 border border-border/50 p-4 rounded-xl bg-background/50">
      <div className="flex gap-2">
        <Input
          placeholder="ENTER PROMO CODE"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          className="uppercase font-semibold tracking-wider"
          disabled={!!appliedCoupon || validating}
        />
        {appliedCoupon ? (
          <Button variant="destructive" onClick={() => { onCouponRemoved(); setInputCode(""); }}>
            Remove
          </Button>
        ) : (
          <Button onClick={() => handleApply(inputCode)} disabled={validating}>
            {validating ? "..." : "Apply"}
          </Button>
        )}
      </div>

      {appliedCoupon && (
        <div className="text-xs text-emerald-500 font-bold flex items-center gap-1">
          <Ticket size={12} />
          PROMO CODE "{appliedCoupon}" IS APPLIED.
        </div>
      )}

      {coupons.length > 0 && !appliedCoupon && (
        <div className="space-y-2 mt-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Available Offers</p>
          <div className="grid gap-2 max-h-[160px] overflow-y-auto pr-1">
            {coupons.map((coupon) => (
              <Card
                key={coupon._id}
                className="p-3 border border-dashed border-border/80 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => handleApply(coupon.code)}
              >
                <div>
                  <div className="font-extrabold text-sm text-primary uppercase tracking-wider">{coupon.code}</div>
                  <div className="text-xs font-semibold text-foreground mt-0.5">{coupon.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{coupon.description}</div>
                </div>
                <Button variant="ghost" size="sm" className="font-bold text-xs uppercase text-primary hover:text-primary hover:bg-primary/10">
                  Apply
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
