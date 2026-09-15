import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { inr, shortDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { IndianRupee, Receipt, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { AddTransactionDialog } from "@/components/dialogs/AddTransactionDialog";

export const Route = createFileRoute("/admin/transactions")({
  loader: async () => {
    const res: any = await api.get("/transactions?limit=200");
    return res.data.transactions;
  },
  component: TransactionsPage,
});

function TransactionsPage() {
  const nav = useNavigate();
  const transactions = Route.useLoaderData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const paid = transactions.filter((t: any) => t.status === "paid");
  const revenue = paid.reduce((s: number, t: any) => s + t.amount, 0);
  const pending = transactions.filter((t: any) => t.status === "pending").length;

  const columns: ColumnDef<any>[] = [
    { accessorKey: "orderNo", header: "Order" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "productName", header: "Product" },
    { accessorKey: "vendorName", header: "Vendor" },
    { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <span className="font-medium">{inr(getValue() as number)}</span> },
    { accessorKey: "paymentMethod", header: "Method", cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span> },
    { accessorKey: "date", header: "Date", cell: ({ getValue }) => shortDate(getValue() as string) },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <Button size="icon" variant="ghost" onClick={() => nav({ to: "/admin/transactions/$id", params: { id: row.original.id } })}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="All orders, payments, refunds, and payouts."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Exported CSV")}>
              <Download className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => toast.success("Exported PDF")}>
              <FileText className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New transaction
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Revenue (paid)" value={inr(revenue)} icon={IndianRupee} tone="accent" />
        <StatCard label="Total transactions" value={String(transactions.length)} icon={Receipt} tone="primary" />
        <StatCard label="Pending" value={String(pending)} icon={TrendingUp} tone="warning" />
      </div>
      <DataTable columns={columns} data={transactions} searchKeys={["orderNo", "customer", "productName", "vendorName"]} searchPlaceholder="Search transactions…" />
      
      {/* Transaction Creation Modal Popup */}
      <AddTransactionDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
