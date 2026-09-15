import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Eye, Pencil, Trash2, Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import api from "@/lib/api";
import { inr, num } from "@/lib/format";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";

export const Route = createFileRoute("/admin/products")({
  loader: async () => {
    const res: any = await api.get("/products?limit=200");
    return res.data.products;
  },
  component: Products,
});

function Products() {
  const nav = useNavigate();
  const router = useRouter();
  const products = Route.useLoaderData();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image} className="h-9 w-9 rounded-md object-cover" />
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs text-muted-foreground">{row.original.sku}</div>
          </div>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "vendorName", header: "Vendor" },
    { accessorKey: "price", header: "Price", cell: ({ getValue }) => inr(getValue() as number) },
    { accessorKey: "stock", header: "Stock", cell: ({ getValue }) => num(getValue() as number) },
    { accessorKey: "sales", header: "Sold" },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/admin/products/$id", params: { id: row.original.id } })}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/admin/products/$id/edit", params: { id: row.original.id } })}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              try {
                await api.delete(`/products/${row.original.id}`);
                toast.success(`${row.original.name} deleted`);
                router.invalidate();
              } catch (err: any) {
                toast.error(err.message || "Failed to delete product");
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Browse the entire marketplace catalog."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Exported")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add product
            </Button>
          </>
        }
      />
      <DataTable columns={columns} data={products} searchKeys={["name", "sku", "category", "vendorName"]} searchPlaceholder="Search products…" />
      
      {/* Product Creation Modal Popup */}
      <AddProductDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
