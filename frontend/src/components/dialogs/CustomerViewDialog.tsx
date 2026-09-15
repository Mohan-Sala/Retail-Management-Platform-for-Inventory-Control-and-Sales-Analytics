import { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, Calendar, ShoppingBag, DollarSign, Clock, ListOrdered, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { inr, num, shortDate } from "@/lib/format";
import api from "@/lib/api";

interface CustomerViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: any;
}

export function CustomerViewDialog({ open, onOpenChange, customer }: CustomerViewDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      const custId = customer.id || customer._id;

      async function loadCustomerTransactions() {
        try {
          setLoading(true);
          const res: any = await api.get(`/transactions?customerId=${custId}&limit=5`);
          setTransactions(res.data.transactions || []);
        } catch (err) {
          toast.error("Failed to load customer transactions history");
        } finally {
          setLoading(false);
        }
      }

      async function loadRecommendations() {
        try {
          setRecsLoading(true);
          const res: any = await api.get(`/recommendation/${custId}?limit=4`);
          setRecommendations(res.data.recommendedProducts || []);
        } catch (err) {
          // Silent catch for scoping boundary errors on third-party vendor logs
          setRecommendations([]);
        } finally {
          setRecsLoading(false);
        }
      }

      loadCustomerTransactions();
      loadRecommendations();
    }
  }, [open, customer]);

  if (!customer) return null;

  // Compute category badge styling
  const category = customer.customerCategory || "Bronze";
  const getBadgeColor = (cat: string) => {
    if (cat === "Gold") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (cat === "Silver") return "bg-slate-400/10 text-slate-600 border-slate-400/20";
    return "bg-amber-600/10 text-amber-700 border-amber-600/20";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {customer.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {customer.name}
                <Badge variant="outline" className={`ml-2 text-xs font-semibold ${getBadgeColor(category)}`}>
                  {category} Member
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Customer account record generated on {shortDate(customer.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 mt-2">
          {/* Contact Details Grid */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <div className="p-3.5 border rounded-lg bg-card text-card-foreground space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 border rounded-lg bg-card text-card-foreground space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location / Address</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground pl-6 truncate">
                    {customer.address || "No billing address provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats metrics block */}
          <div className="grid gap-3 grid-cols-3">
            <Card className="p-3 text-center space-y-1 bg-muted/30">
              <ShoppingBag className="mx-auto h-4 w-4 text-primary" />
              <div className="text-[10px] text-muted-foreground uppercase font-medium">Orders Count</div>
              <div className="text-lg font-bold">{num(customer.totalOrders)}</div>
            </Card>

            <Card className="p-3 text-center space-y-1 bg-muted/30">
              <DollarSign className="mx-auto h-4 w-4 text-emerald-600" />
              <div className="text-[10px] text-muted-foreground uppercase font-medium">Total Spending</div>
              <div className="text-lg font-bold">{inr(customer.totalSpending)}</div>
            </Card>

            <Card className="p-3 text-center space-y-1 bg-muted/30">
              <Clock className="mx-auto h-4 w-4 text-amber-600" />
              <div className="text-[10px] text-muted-foreground uppercase font-medium">Last Purchase</div>
              <div className="text-xs font-bold pt-1">
                {customer.lastPurchaseDate ? shortDate(customer.lastPurchaseDate) : "Never"}
              </div>
            </Card>
          </div>

          {/* Recommended Products */}
          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Recommended Products
            </div>

            {recsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 border rounded-lg animate-pulse bg-muted/20">
                    <div className="h-14 w-14 rounded-md bg-muted" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((p) => (
                  <div key={p.productId} className="flex gap-3 p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors relative overflow-hidden group flex-col justify-between">
                    <div className="flex gap-3">
                      {p.productImage ? (
                        <img src={p.productImage} alt={p.productName} className="h-14 w-14 rounded object-cover border" />
                      ) : (
                        <div className="h-14 w-14 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No Image</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs truncate">{p.productName}</div>
                        <div className="text-[9px] text-muted-foreground truncate">SKU: {p.sku} · Stock: {p.currentStock}</div>
                        <div className="text-[9px] text-emerald-600">Confidence: {p.confidenceScore || 90}%</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {(p.recommendationReasons || [p.recommendationReason]).map((r: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-[8px] px-1 py-0">{r}</Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <span className="font-bold text-xs text-primary">{inr(p.price)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={async () => {
                            try {
                              await api.post("/recommendation/feedback", {
                                customerId: customer.id || customer._id,
                                productId: p.productId,
                                recommendationId: "customer_view_dialog",
                                action: "CLICKED",
                              });
                              toast.success("Feedback submitted!");
                            } catch (e) {
                              toast.error("Feedback failed");
                            }
                          }}
                          className="px-2 py-0.5 bg-muted hover:bg-primary/20 text-[9px] rounded font-medium"
                        >
                          Like
                        </button>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="text-[8px] bg-secondary/80 text-secondary-foreground font-semibold px-1 py-0 border-border">
                        Score: {p.recommendationScore}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border rounded-md border-dashed text-xs text-muted-foreground flex flex-col items-center justify-center gap-1 bg-muted/5">
                <Sparkles className="h-4 w-4 text-muted-foreground/60" />
                <span>No recommendation suggestions available for this profile yet.</span>
              </div>
            )}
          </div>

          {/* Recent checkout transaction history */}
          <div className="space-y-2.5 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" />
              Recent Purchases (Latest First)
            </div>
            
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading transactions...
              </div>
            ) : transactions.length > 0 ? (
              <div className="border rounded-md divide-y divide-border overflow-hidden bg-card text-card-foreground">
                {transactions.map((tx) => (
                  <div key={tx._id || tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{tx.orderNo}</div>
                      <div className="text-muted-foreground truncate">{tx.productName || "Product"} · Quantity: {tx.qty}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-sm">{inr(tx.amount)}</div>
                      <div className="text-muted-foreground text-[10px]">{shortDate(tx.date)}</div>
                    </div>
                    <div className="ml-4">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border rounded-md border-dashed text-sm text-muted-foreground flex flex-col items-center gap-1 bg-muted/5">
                <ShieldAlert className="h-5 w-5 text-muted-foreground/60" />
                <span>No transaction logs found for this customer.</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
