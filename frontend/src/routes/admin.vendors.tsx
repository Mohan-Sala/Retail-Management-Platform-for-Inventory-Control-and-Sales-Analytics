import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Plus, Eye, Pencil, Trash2, Download } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { inr, shortDate } from "@/lib/format";
import api from "@/lib/api";
import { AddVendorDialog } from "@/components/dialogs/AddVendorDialog";

export const Route = createFileRoute("/admin/vendors")({
  loader: async () => {
    const res: any = await api.get("/vendors?limit=100");
    return res.data.vendors;
  },
  component: VendorsList
});

function VendorsList() {
  const nav = useNavigate();
  const router = useRouter();
  const vendors = Route.useLoaderData();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "businessName",
      header: "Vendor",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar} />
            <AvatarFallback>{row.original.businessName?.[0] || "V"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.businessName}</div>
            <div className="truncate text-xs text-muted-foreground">{row.original.ownerName}</div>
          </div>
        </div>
      ),
    },
    { accessorKey: "city", header: "City" },
    { accessorKey: "productCount", header: "Products" },
    { accessorKey: "commission", header: "Commission", cell: ({ getValue }) => `${getValue()}%` },
    { accessorKey: "revenue", header: "Revenue", cell: ({ getValue }) => <span className="font-medium">{inr(getValue() as number)}</span> },
    { accessorKey: "joinedAt", header: "Joined", cell: ({ getValue }) => shortDate(getValue() as string) },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/admin/vendors/$id", params: { id: row.original.id } })}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => nav({ to: "/admin/vendors/$id/edit", params: { id: row.original.id } })}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              try {
                await api.delete(`/vendors/${row.original.id}`);
                toast.success(`${row.original.businessName} deleted`);
                router.invalidate();
              } catch (err: any) {
                toast.error(err.message || "Failed to delete vendor");
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
        title="Vendors"
        description="Onboard, verify, and monitor every marketplace partner."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Exported CSV")}>
              <Download className="mr-1.5 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add vendor
            </Button>
          </>
        }
      />
      <DataTable columns={columns} data={vendors} searchKeys={["businessName", "ownerName", "city", "email"]} searchPlaceholder="Search vendors…" />
      
      {/* Vendor Creation Modal Popup */}
      <AddVendorDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
