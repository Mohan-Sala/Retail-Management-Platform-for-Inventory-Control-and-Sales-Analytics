import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Download, Search, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CustomerViewDialog } from "@/components/dialogs/CustomerViewDialog";
import { inr, num, shortDate } from "@/lib/format";
import api from "@/lib/api";

const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
  search: z.string().optional().catch(""),
  category: z.string().optional().catch("all"),
  city: z.string().optional().catch("all"),
  sortBy: z.string().catch("newest"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
});

export const Route = createFileRoute("/vendor/customers")({
  validateSearch: (search: Record<string, unknown>) => {
    const s = search || {};
    return {
      page: Number(s.page || 1),
      limit: Number(s.limit || 10),
      search: (s.search as string) || "",
      category: (s.category as string) || "all",
      city: (s.city as string) || "all",
      sortBy: (s.sortBy as string) || "newest",
      sortOrder: ((s.sortOrder as string) || "desc") as "asc" | "desc",
    };
  },
  loader: async ({ search = {} as any }) => {
    const params = new URLSearchParams();
    params.set("page", String(search.page || 1));
    params.set("limit", String(search.limit || 10));
    params.set("sortBy", search.sortBy || "newest");
    params.set("sortOrder", search.sortOrder || "desc");

    if (search.search) params.set("search", search.search);
    if (search.category && search.category !== "all") params.set("category", search.category);
    if (search.city && search.city !== "all") params.set("city", search.city);

    // Queries customers endpoint. Scoped parameters on the backend filter to vendor's items.
    const res: any = await api.get(`/customers?${params.toString()}`);
    return {
      customers: res.data || [],
      pagination: res.pagination || { page: 1, limit: 10, pages: 1, total: 0 },
    };
  },
  component: VendorCustomersList,
});

function VendorCustomersList() {
  const router = useRouter();
  const searchParams = Route.useSearch() || {};
  const { customers = [], pagination = { page: 1, limit: 10, pages: 1, total: 0 } } = Route.useLoaderData() || {};
  const navigate = useNavigate({ from: Route.fullPath });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [localSearch, setLocalSearch] = useState(searchParams.search || "");

  // Debounced search query handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchParams.search) {
        navigate({
          search: (prev: any) => ({ ...prev, search: localSearch, page: 1 }),
        });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const updateQuery = (updates: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      search: (prev: any) => ({ ...prev, ...updates, page: 1 }),
    });
  };

  const getBadgeColor = (cat: string) => {
    if (cat === "Gold") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (cat === "Silver") return "bg-slate-400/10 text-slate-600 border-slate-400/20";
    return "bg-amber-600/10 text-amber-700 border-amber-600/20";
  };

  // CSV Exporter
  const handleExportCSV = () => {
    try {
      const headers = ["Customer Name", "Phone", "Email", "City", "Total Orders", "Total Spending", "Category Tier", "Joined Date"];
      const rows = customers.map((c: any) => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email}"`,
        `"${c.city}"`,
        c.totalOrders,
        c.totalSpending,
        c.customerCategory || "Bronze",
        new Date(c.createdAt).toISOString().split("T")[0],
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `ShopSense_MyCustomers_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Customer list exported successfully");
    } catch (err) {
      toast.error("Failed to generate CSV export file");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-semibold text-sm cursor-pointer hover:underline text-primary" onClick={() => {
            setSelectedCust(row.original);
            setIsViewOpen(true);
          }}>
            {row.original.name}
          </div>
        ),
      },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "city", header: "City" },
      {
        accessorKey: "totalOrders",
        header: "Orders",
        cell: ({ getValue }) => num(getValue() as number),
      },
      {
        accessorKey: "totalSpending",
        header: "Total Spending",
        cell: ({ getValue }) => <span className="font-semibold">{inr(getValue() as number)}</span>,
      },
      {
        accessorKey: "customerCategory",
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.customerCategory || "Bronze";
          return (
            <Badge variant="outline" className={`font-semibold ${getBadgeColor(cat)}`}>
              {cat}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Joined Date",
        cell: ({ getValue }) => shortDate(getValue() as string),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              size="icon"
              variant="ghost"
              title="View Details"
              onClick={() => {
                setSelectedCust(row.original);
                setIsViewOpen(true);
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ),
      },
    ],
    [customers]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="View contact directory lists and purchase statistics for your active store customers."
        actions={
          <Button variant="outline" onClick={handleExportCSV} className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search directory..."
            className="pl-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select
            value={searchParams.city}
            onValueChange={(v) => updateQuery({ city: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="City Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.category}
            onValueChange={(v) => updateQuery({ category: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            title="Refresh logs"
            onClick={async () => {
              await router.invalidate();
              toast.success("Directory refreshed");
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        pageCount={pagination?.pages || 1}
        pageIndex={(pagination?.page || 1) - 1}
        pageSize={pagination?.limit || 10}
        onPaginationChange={(updater) => {
          const nextState = typeof updater === "function" ? updater({ pageIndex: (pagination?.page || 1) - 1, pageSize: pagination?.limit || 10 }) : updater;
          navigate({
            search: (prev: any) => ({
              ...prev,
              page: nextState.pageIndex + 1,
              limit: nextState.pageSize,
            }),
          });
        }}
      />

      <CustomerViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        customer={selectedCust}
      />
    </div>
  );
}
