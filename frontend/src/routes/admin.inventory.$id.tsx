import { createFileRoute, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, BackLink } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { INVENTORY } from "@/lib/mock-data";
import { num, shortDate } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/admin/inventory/$id")({
  loader: ({ params }) => { const i = INVENTORY.find((x) => x.id === params.id); if (!i) throw notFound(); return i; },
  component: InventoryDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Not found.</div>,
});

function InventoryDetail() {
  const i = Route.useLoaderData();
  const [stock, setStock] = useState(i.stock);
  const history = Array.from({ length: 6 }, (_, k) => ({ d: shortDate(new Date(Date.now() - k * 86400000 * 3).toISOString()), delta: (k % 2 ? -1 : 1) * (5 + k * 3) }));
  return (
    <div>
      <BackLink to="/admin/inventory" label="Back to inventory" />
      <PageHeader title={i.productName} description={`${i.vendorName} · ${i.warehouse}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Current stock</div>
          <div className="mt-1 text-4xl font-bold">{num(stock)}</div>
          <div className="mt-2 text-sm text-muted-foreground">Reorder at {i.reorderLevel} · Last update {shortDate(i.lastUpdated)}</div>

          <div className="mt-6 space-y-2">
            <Label>Update stock</Label>
            <div className="flex gap-2">
              <Input type="number" value={stock} onChange={(e) => setStock(+e.target.value)} />
              <Button onClick={() => toast.success("Stock updated")}>Save</Button>
            </div>
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Stock history</div>
          <div className="mt-4 divide-y divide-border">
            {history.map((h) => (
              <div key={h.d} className="flex items-center justify-between py-2 text-sm">
                <div>{h.d}</div>
                <div className={h.delta > 0 ? "text-success" : "text-destructive"}>{h.delta > 0 ? "+" : ""}{h.delta} units</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
