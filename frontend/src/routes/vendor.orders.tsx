import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, FileText, IndianRupee, Receipt, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useVendorScope } from "@/hooks/useVendorScope";
import { inr, shortDate } from "@/lib/format";
import type { Transaction } from "@/lib/mock-data";
import { StatCard } from "@/components/dashboard/StatCard";

export const Route = createFileRoute("/vendor/orders")({ component: VendorOrders });

function VendorOrders() {
  const nav = useNavigate();
  const { orders } = useVendorScope();
  const revenue = orders.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const pending = orders.filter((t) => t.status === "pending").length;

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "productName", header: "Product" },
    { accessorKey: "qty", header: "Qty" },
    { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => inr(getValue() as number) },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => shortDate(getValue() as string) },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    { id: "actions", header: "", enableSorting: false, cell: ({ row }) => (
      <Button size="icon" variant="ghost" onClick={() => nav({ to: "/vendor/orders/$id", params: { id: row.original.id } })}><Eye className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <PageHeader title="Orders" description="Track and fulfill customer transactions."
        actions={<>
          <Button variant="outline" onClick={() => toast.success("Exported CSV")}><Download className="mr-1.5 h-4 w-4" /> CSV</Button>
          <Button variant="outline" onClick={() => toast.success("Exported PDF")}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
        </>} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Revenue" value={inr(revenue)} icon={IndianRupee} tone="accent" />
        <StatCard label="Total orders" value={String(orders.length)} icon={Receipt} tone="primary" />
        <StatCard label="Pending" value={String(pending)} icon={TrendingUp} tone="warning" />
      </div>
      <DataTable columns={columns} data={orders} searchKeys={["orderNo", "customer", "productName"]} searchPlaceholder="Search orders…" />
    </div>
  );
}
