import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import api from "@/lib/api";
import { inr, shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/transactions/$id")({
  loader: async ({ params }) => {
    try {
      const res: any = await api.get(`/transactions/${params.id}`);
      return res.data;
    } catch {
      throw notFound();
    }
  },
  component: TxnDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Not found.</div>,
});

function TxnDetail() {
  const t = Route.useLoaderData();
  return (
    <div>
      <BackLink to="/admin/transactions" label="Back to transactions" />
      <PageHeader title={t.orderNo} description={`${shortDate(t.date)} · ${t.paymentMethod.toUpperCase()}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div><div className="text-3xl font-bold">{inr(t.amount)}</div><div className="text-sm text-muted-foreground">Total amount</div></div>
            <StatusBadge status={t.status} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div><div className="text-xs text-muted-foreground">Customer</div><div className="font-medium">{t.customer}</div></div>
            <div><div className="text-xs text-muted-foreground">Product</div><Link to="/admin/products/$id" params={{ id: t.productId }} className="font-medium hover:underline">{t.productName}</Link></div>
            <div><div className="text-xs text-muted-foreground">Vendor</div><Link to="/admin/vendors/$id" params={{ id: t.vendorId }} className="font-medium hover:underline">{t.vendorName}</Link></div>
            <div><div className="text-xs text-muted-foreground">Quantity</div><div className="font-medium">{t.qty}</div></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-semibold">Timeline</div>
          <ol className="mt-4 space-y-4 text-sm">
            {[["Placed", shortDate(t.date)], ["Confirmed", shortDate(t.date)], ["Fulfilled", shortDate(t.date)], ["Settled", t.status === "paid" ? shortDate(t.date) : "—"]].map(([l, v]) => (
              <li key={l} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><div className="font-medium">{l}</div><div className="text-xs text-muted-foreground">{v}</div></div></li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
