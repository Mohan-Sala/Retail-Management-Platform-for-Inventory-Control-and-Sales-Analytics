import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import api from "@/lib/api";
import { inr, num, shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/products/$id")({
  loader: async ({ params }) => {
    try {
      const res: any = await api.get(`/products/${params.id}`);
      return res.data;
    } catch {
      throw notFound();
    }
  },
  component: Detail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Product not found.</div>,
});

function Detail() {
  const p = Route.useLoaderData();
  return (
    <div>
      <BackLink to="/admin/products" label="Back to products" />
      <PageHeader title={p.name} description={`${p.category} · ${p.sku}`}
        actions={<Button asChild><Link to="/admin/products/$id/edit" params={{ id: p.id }}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Link></Button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-1"><img src={p.image} className="aspect-square w-full object-cover" /></Card>
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div><div className="text-3xl font-bold">{inr(p.price)}</div><div className="text-sm text-muted-foreground">Listing price</div></div>
            <StatusBadge status={p.status} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{p.description}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[["Stock", num(p.stock)], ["Reorder at", num(p.reorderLevel)], ["Sales", num(p.sales)], ["Listed", shortDate(p.createdAt)]].map(([l, v]) => (
              <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-lg font-semibold">{v}</div></div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground">Sold by</div>
            <Link to="/admin/vendors/$id" params={{ id: p.vendorId }} className="text-sm font-medium hover:underline">{p.vendorName}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
