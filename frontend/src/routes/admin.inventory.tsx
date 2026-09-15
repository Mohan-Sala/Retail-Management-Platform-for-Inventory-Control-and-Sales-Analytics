import { createFileRoute } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, Warehouse, Plus, Pencil, Info } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { num, shortDate } from "@/lib/format";
import { StatCard } from "@/components/dashboard/StatCard";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { InventoryDialog } from "@/components/dialogs/InventoryDialog";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books", "Toys", "Grocery"];

export const Route = createFileRoute("/admin/inventory")({
  loader: async () => {
    const res: any = await api.get("/inventory?limit=200");
    return res.data.inventory || [];
  },
  component: InventoryPage,
});

function InventoryPage() {
  const inventory = Route.useLoaderData();

  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Load vendors list for filter dropdown
  useEffect(() => {
    async function loadVendors() {
      try {
        const res: any = await api.get("/vendors?limit=100");
        setVendors(res.data.vendors || []);
      } catch (err) {
        console.error("Failed to load vendors for filter:", err);
      }
    }
    loadVendors();
  }, []);

  // Filter dataset in-memory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item: any) => {
      if (selectedVendorId !== "all" && item.vendorId !== selectedVendorId) return false;
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;
      return true;
    });
  }, [inventory, selectedVendorId, selectedCategory, selectedStatus]);

  // Aggregate stats
  const low = inventory.filter((i: any) => i.currentStock > 0 && i.currentStock <= i.minimumStock).length;
  const totalUnits = inventory.reduce((s: number, i: any) => s + i.currentStock, 0);
  const outOfStock = inventory.filter((i: any) => i.currentStock === 0).length;

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedItem(null);
    setDialogMode("create");
    setIsDialogOpen(true);
  };

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
    { accessorKey: "vendorName", header: "Vendor" },
    {
      accessorKey: "currentStock",
      header: "Current Stock",
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
    { accessorKey: "minimumStock", header: "Minimum Level" },
    { accessorKey: "maximumStock", header: "Maximum Level" },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "Out of Stock") return <Badge variant="destructive">Out of Stock</Badge>;
        if (status === "Low Stock") return <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/30 border-warning/30">Low Stock</Badge>;
        return <Badge variant="secondary">Healthy</Badge>;
      },
    },
    { accessorKey: "lastUpdated", header: "Last Updated", cell: ({ getValue }) => shortDate(getValue() as string) },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => handleEditClick(row.original)}>
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Tracking"
        description="Multi-warehouse stock configuration, alerts, and threshold controls."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Inventory exported")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Inventory
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Units In Stock" value={num(totalUnits)} icon={Package} tone="primary" />
        <StatCard label="Low Stock Products" value={num(low)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock Items" value={num(outOfStock)} icon={TrendingDown} tone="destructive" />
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card text-card-foreground">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">Filters:</div>
        
        {/* Vendor Filter */}
        <div className="w-[180px]">
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
            <SelectTrigger>
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {(selectedVendorId !== "all" || selectedCategory !== "all" || selectedStatus !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSelectedVendorId("all"); setSelectedCategory("all"); setSelectedStatus("all"); }} className="text-xs">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Datatable */}
      {filteredInventory.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredInventory}
          searchKeys={["productName", "sku", "category", "vendorName"]}
          searchPlaceholder="Search products, SKU, category, or vendor..."
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed text-center p-6 bg-card text-card-foreground">
          <Warehouse className="h-10 w-10 text-muted-foreground/60 mb-3 animate-pulse" />
          <h3 className="text-base font-semibold">No inventory entries found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Try adjusting your active filters or clear them to view the entire marketplace catalog.
          </p>
        </div>
      )}

      {/* Create / Edit Inventory Dialog */}
      <InventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        editItem={selectedItem}
      />
    </div>
  );
}
