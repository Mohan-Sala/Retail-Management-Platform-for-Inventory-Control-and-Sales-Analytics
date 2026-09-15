import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import api from "@/lib/api";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/vendor/orders/$id")({
  loader: async ({ params }) => {
    try {
      const res: any = await api.get(`/transactions/${params.id}`);
      return res.data;
    } catch {
      throw notFound();
    }
  },
  component: VendorOrderDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Not found.</div>,
});

function VendorOrderDetail() {
  const t = Route.useLoaderData();
  return (
    <div>
      <BackLink to="/vendor/orders" label="Back to orders" />
      <PageHeader title={t.orderNo} description={`${shortDate(t.date)} · ${t.paymentMethod.toUpperCase()}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div><div className="text-3xl font-bold">{inr(t.amount)}</div><div className="text-sm text-muted-foreground">Order total</div></div>
            <StatusBadge status={t.status} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div><div className="text-xs text-muted-foreground">Customer</div><div className="font-medium">{t.customer}</div></div>
            <div><div className="text-xs text-muted-foreground">Product</div><div className="font-medium">{t.productName}</div></div>
            <div><div className="text-xs text-muted-foreground">Qty</div><div className="font-medium">{t.qty}</div></div>
            <div><div className="text-xs text-muted-foreground">Method</div><div className="font-medium capitalize">{t.paymentMethod}</div></div>
          </div>
        </Card>
        <Card className="p-6"><div className="text-sm font-semibold">Fulfillment</div>
          <ol className="mt-4 space-y-4 text-sm">
            {["Placed", "Confirmed", "Packed", "Shipped", "Delivered"].map((s, i) => (
              <li key={s} className="flex gap-3"><div className={"mt-1 h-2 w-2 rounded-full " + (i < 3 ? "bg-primary" : "bg-muted-foreground/30")} /><div className="font-medium">{s}</div></li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
