import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Pencil, Mail, Phone, MapPin, IndianRupee, Package, Receipt } from "lucide-react";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { inr, num, shortDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";

export const Route = createFileRoute("/admin/vendors/$id")({
  loader: async ({ params }) => {
    try {
      const [vendorRes, productsRes, txsRes] = await Promise.all([
        api.get(`/vendors/${params.id}`),
        api.get(`/products?vendorId=${params.id}&limit=100`),
        api.get(`/transactions?vendorId=${params.id}&limit=100`)
      ]);
      return {
        vendor: (vendorRes as any).data,
        products: (productsRes as any).data.products,
        transactions: (txsRes as any).data.transactions
      };
    } catch {
      throw notFound();
    }
  },
  component: VendorDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Vendor not found.</div>,
});

function VendorDetail() {
  const { vendor: v, products, transactions: txs } = Route.useLoaderData();
  const revenue = txs.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <BackLink to="/admin/vendors" label="Back to vendors" />
      <PageHeader
        title={v.businessName}
        description={`${v.ownerName} · ${v.city}`}
        actions={<Button asChild><Link to="/admin/vendors/$id/edit" params={{ id: v.id }}><Pencil className="mr-1.5 h-4 w-4" /> Edit</Link></Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14"><AvatarImage src={v.avatar} /><AvatarFallback>{v.businessName[0]}</AvatarFallback></Avatar>
            <div className="min-w-0"><div className="font-semibold">{v.businessName}</div><StatusBadge status={v.status} /></div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {v.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {v.phone}</div>
            <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4" /> <span>{v.address}, {v.city}</span></div>
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              <div>GST: <span className="text-foreground">{v.gst}</span></div>
              <div>Commission: <span className="text-foreground">{v.commission}%</span></div>
              <div>Joined: <span className="text-foreground">{shortDate(v.joinedAt)}</span></div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Revenue" value={inr(revenue)} icon={IndianRupee} tone="accent" />
            <StatCard label="Products" value={num(products.length)} icon={Package} tone="primary" />
            <StatCard label="Orders" value={num(txs.length)} icon={Receipt} tone="primary" />
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <Card className="divide-y divide-border">
                {products.slice(0, 8).map((p) => (
                  <Link key={p.id} to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3 p-3 hover:bg-muted">
                    <img src={p.image} className="h-10 w-10 rounded-md object-cover" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.category} · {p.sku}</div></div>
                    <div className="text-sm font-semibold">{inr(p.price)}</div>
                    <StatusBadge status={p.status} />
                  </Link>
                ))}
                {products.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No products yet</div>}
              </Card>
            </TabsContent>
            <TabsContent value="transactions">
              <Card className="divide-y divide-border">
                {txs.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 text-sm">
                    <div><div className="font-medium">{t.orderNo}</div><div className="text-xs text-muted-foreground">{shortDate(t.date)} · {t.customer}</div></div>
                    <div className="text-right"><div className="font-semibold">{inr(t.amount)}</div><StatusBadge status={t.status} /></div>
                  </div>
                ))}
              </Card>
            </TabsContent>
            <TabsContent value="performance">
              <Card className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[["Avg. order", inr(revenue / Math.max(1, txs.length))], ["Fulfillment", "98.2%"], ["Return rate", "1.4%"], ["Rating", "4.7 / 5"]].map(([l, v]) => (
                    <div key={l}><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-lg font-semibold">{v}</div></div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
