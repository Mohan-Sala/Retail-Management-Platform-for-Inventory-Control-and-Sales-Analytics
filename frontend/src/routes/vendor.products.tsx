import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useVendorScope } from "@/hooks/useVendorScope";
import type { Product } from "@/lib/mock-data";
import { inr } from "@/lib/format";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";

export const Route = createFileRoute("/vendor/products")({ component: VendorProducts });

function VendorProducts() {
  const nav = useNavigate();
  const { products } = useVendorScope();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name", header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image} className="h-9 w-9 rounded-md object-cover" />
          <div><div className="font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.sku}</div></div>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "price", header: "Price", cell: ({ getValue }) => inr(getValue() as number) },
    { accessorKey: "stock", header: "Stock" },
    { accessorKey: "sales", header: "Sold" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/vendor/products/$id", params: { id: row.original.id } })}><Eye className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/vendor/products/$id/edit", params: { id: row.original.id } })}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => toast.success("Deleted")}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="My products" description="Manage your storefront catalog."
        actions={<>
          <Button variant="outline" onClick={() => toast.success("Exported")}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add product</Button>
        </>} />
      <DataTable columns={columns} data={products} searchKeys={["name", "sku", "category"]} searchPlaceholder="Search products…" />
      
      {/* Product Creation Modal Popup */}
      <AddProductDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
