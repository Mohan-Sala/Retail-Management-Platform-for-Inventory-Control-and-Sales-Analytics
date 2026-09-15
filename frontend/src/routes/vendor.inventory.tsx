import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileText, Warehouse } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { num, shortDate } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books", "Toys", "Grocery"];

export const Route = createFileRoute("/vendor/inventory")({
  loader: async () => {
    // Queries database inventory. The backend filters automatically based on vendor JWT.
    const res: any = await api.get("/inventory?limit=200");
    return res.data.inventory || [];
  },
  component: VendorInventory,
});

function VendorInventory() {
  const inventory = Route.useLoaderData();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // In-memory category and status filtering
  const filteredInventory = useMemo(() => {
    return inventory.filter((item: any) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      return true;
    });
  }, [inventory, selectedCategory, selectedStatus]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image} className="h-9 w-9 rounded-md object-cover border" />
          <div>
            <div className="font-medium">{row.original.productName}</div>
            <div className="text-xs text-muted-foreground">Category: {row.original.category}</div>
          </div>
        </div>
      ),
    },
    { accessorKey: "sku", header: "SKU" },
    {
      accessorKey: "currentStock",
      header: "Stock",
      cell: ({ row }) => {
        const s = row.original.currentStock;
        const r = row.original.minimumStock;
        return (
          <span className={s === 0 ? "font-semibold text-destructive" : s <= r ? "font-semibold text-warning-foreground" : ""}>
            {num(s)}
          </span>
        );
      },
    },
    { accessorKey: "minimumStock", header: "Reorder Threshold" },
    { accessorKey: "maximumStock", header: "Maximum Level" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "Out of Stock") return <Badge variant="destructive">Out of stock</Badge>;
        if (status === "Low Stock") return <Badge className="bg-warning/20 text-warning-foreground">Low</Badge>;
        return <Badge variant="secondary">Healthy</Badge>;
      },
    },
    { accessorKey: "lastUpdated", header: "Last Updated", cell: ({ getValue }) => shortDate(getValue() as string) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Inventory"
        description="Track and monitor stock levels across your catalog."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("CSV exported")}>
              <Download className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => toast.success("PDF exported")}>
              <FileText className="mr-1.5 h-4 w-4" /> PDF
            </Button>
          </>
        }
      />

      {/* Advanced Filter Toolbar (No Vendor filter) */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card text-card-foreground">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">Filters:</div>

        {/* Category Filter */}
        <div className="w-[160px]">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[150px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(selectedCategory !== "all" || selectedStatus !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory("all"); setSelectedStatus("all"); }} className="text-xs">
            Clear Filters
          </Button>
        )}
      </div>

      {filteredInventory.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredInventory}
          searchKeys={["productName", "sku", "category"]}
          searchPlaceholder="Search product, SKU, or category…"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed text-center p-6 bg-card text-card-foreground">
          <Warehouse className="h-10 w-10 text-muted-foreground/60 mb-3 animate-pulse" />
          <h3 className="text-base font-semibold">No stock items match your search</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Modify or clear your filters to view all products in your catalog.
          </p>
        </div>
      )}
    </div>
  );
}
