import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { inr } from "@/lib/format";
import api from "@/lib/api";

export const Route = createFileRoute("/customer/orders")({
  component: CustomerOrders,
});

function CustomerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/orders");
      setOrders(res.data || []);
    } catch (e) {
      console.error("Failed to load customer orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Retrieving orders history...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Orders History"
        description="Monitor delivery statuses, view item purchase receipts, and track past order details."
      />

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order._id;
          return (
            <Card key={order._id} className="border border-border/60 overflow-hidden">
              {/* Header Panel */}
              <div className="p-4 bg-muted/20 flex flex-wrap gap-4 items-center justify-between cursor-pointer" onClick={() => toggleExpand(order._id)}>
                <div className="flex gap-6 items-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Order Date</div>
                    <div className="text-xs font-semibold mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Order Number</div>
                    <div className="text-xs font-mono font-bold mt-0.5">{order.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Paid</div>
                    <div className="text-xs font-mono font-bold text-primary mt-0.5">{inr(order.totalAmount)}</div>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <span className="text-[10px] capitalize font-extrabold px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {order.orderStatus}
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs">
                    {isExpanded ? "Hide Details" : "View Receipt"}
                  </Button>
                </div>
              </div>

              {/* Collapsible Receipt Details */}
              {isExpanded && (
                <div className="p-5 border-t border-border/40 divide-y divide-border/40 bg-card">
                  {/* Items List Snapshots */}
                  <div className="pb-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-2">Purchased Items</h4>
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex gap-4 items-center justify-between text-xs">
                        <div className="flex gap-3 items-center">
                          <img src={item.snapshot?.productImage || "https://picsum.photos/seed/default/60/60"} alt="" className="h-12 w-12 object-cover rounded-md" />
                          <div>
                            <div className="font-semibold text-foreground">{item.snapshot?.productName || "Product"}</div>
                            <div className="text-[10px] text-muted-foreground">SKU: {item.snapshot?.productSKU} &bull; Shop: {item.snapshot?.vendorName}</div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div>{item.quantity} x {inr(item.snapshot?.unitPrice || item.price)}</div>
                          <div className="font-bold text-foreground mt-0.5">{inr(item.subtotal)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping details */}
                  <div className="py-4 grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-1.5">Shipping Destination</h4>
                      <div className="font-semibold">{order.shippingAddress?.fullName}</div>
                      <div>{order.shippingAddress?.phone}</div>
                      <div className="text-muted-foreground mt-1">
                        {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2 && `${order.shippingAddress.addressLine2}, `}
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wide mb-1.5">Receipt Timeline</h4>
                      <div className="space-y-2 mt-1">
                        {order.statusHistory.map((hist: any, index: number) => (
                          <div key={index} className="flex gap-2 items-start text-[11px]">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                            <div>
                              <span className="font-semibold capitalize text-foreground">{hist.status}</span>
                              <span className="text-muted-foreground text-[10px] ml-1">({new Date(hist.updatedAt).toLocaleString()})</span>
                              {hist.notes && <div className="text-muted-foreground mt-0.5 leading-relaxed">{hist.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {orders.length === 0 && (
          <div className="py-16 text-center border border-dashed rounded-lg border-border/60 text-muted-foreground">
            <span>No orders placed yet. Check out the Marketplace to start shopping!</span>
          </div>
        )}
      </div>
    </div>
  );
}
