import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Users, IndianRupee, Receipt, Sparkles, TrendingUp, Calendar, MapPin, Download, Search, RefreshCw, Layers } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/dashboard/StatCard";
import { inr, num, shortDate } from "@/lib/format";
import api from "@/lib/api";

const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

const tooltipStyle = {
  contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
  search: z.string().optional().catch(""),
  category: z.string().optional().catch("all"),
  city: z.string().optional().catch("all"),
  minSpending: z.number().optional().catch(undefined),
  maxSpending: z.number().optional().catch(undefined),
  sortBy: z.string().catch("spending"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
});

export const Route = createFileRoute("/vendor/customer-segmentation")({
  validateSearch: (search: Record<string, unknown>) => {
    const s = search || {};
    return {
      page: Number(s.page || 1),
      limit: Number(s.limit || 10),
      search: (s.search as string) || "",
      category: (s.category as string) || "all",
      city: (s.city as string) || "all",
      minSpending: s.minSpending ? Number(s.minSpending) : undefined,
      maxSpending: s.maxSpending ? Number(s.maxSpending) : undefined,
      sortBy: (s.sortBy as string) || "spending",
      sortOrder: ((s.sortOrder as string) || "desc") as "asc" | "desc",
    };
  },
  loader: async ({ search = {} as any }) => {
    const params = new URLSearchParams();
    params.set("page", String(search.page || 1));
    params.set("limit", String(search.limit || 10));
    params.set("sortBy", search.sortBy || "spending");
    params.set("sortOrder", search.sortOrder || "desc");

    if (search.search) params.set("search", search.search);
    if (search.category && search.category !== "all") params.set("category", search.category);
    if (search.city && search.city !== "all") params.set("city", search.city);
    if (search.minSpending !== undefined) params.set("minSpending", String(search.minSpending));
    if (search.maxSpending !== undefined) params.set("maxSpending", String(search.maxSpending));

    const res: any = await api.get(`/customer-segmentation?${params.toString()}`);
    return res.data;
  },
  component: VendorCustomerSegmentation,
});

function VendorCustomerSegmentation() {
  const router = useRouter();
  // @ts-ignore
  const searchParams = Route.useSearch() || {};
  const data = Route.useLoaderData() || {};
  const navigate = useNavigate({ from: Route.fullPath });

  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [localMinSpend, setLocalMinSpend] = useState<string>(searchParams.minSpending ? String(searchParams.minSpending) : "");
  const [localMaxSpend, setLocalMaxSpend] = useState<string>(searchParams.maxSpending ? String(searchParams.maxSpending) : "");

  // Debounce search text input
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

  const handleApplySpending = () => {
    const minVal = localMinSpend !== "" ? parseFloat(localMinSpend) : undefined;
    const maxVal = localMaxSpend !== "" ? parseFloat(localMaxSpend) : undefined;
    navigate({
      search: (prev: any) => ({ ...prev, minSpending: minVal, maxSpending: maxVal, page: 1 }),
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalMinSpend("");
    setLocalMaxSpend("");
    navigate({
      search: () => ({
        page: 1,
        limit: 10,
        search: "",
        category: "all",
        city: "all",
        minSpending: undefined,
        maxSpending: undefined,
        sortBy: "spending",
        sortOrder: "desc",
      }),
    });
  };

  const getBadgeColor = (cat: string) => {
    if (cat === "Gold") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (cat === "Silver") return "bg-slate-400/10 text-slate-600 border-slate-400/20";
    return "bg-amber-600/10 text-amber-700 border-amber-600/20";
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Customer", "Tier Segment", "My Store Spending", "Orders Count", "Average Spending", "Percentage Contribution", "City"];
      const rows = (data.customers || []).map((c: any) => [
        `"${c.name}"`,
        c.category,
        c.spending,
        c.orders,
        c.orders > 0 ? parseFloat((c.spending / c.orders).toFixed(2)) : 0,
        c.percentageContribution,
        c.city,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `ShopSense_MyCustomerSegmentation_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully");
    } catch (err) {
      toast.error("Failed to export scoped customer segmentation data");
    }
  };

  const metrics = data.summaryMetrics || {};

  const pieChartData = [
    { name: "Gold", value: metrics.goldCustomers || 0 },
    { name: "Silver", value: metrics.silverCustomers || 0 },
    { name: "Bronze", value: metrics.bronzeCustomers || 0 },
  ];

  const barChartData = [
    { name: "Gold", revenue: metrics.goldRevenue || 0 },
    { name: "Silver", revenue: metrics.silverRevenue || 0 },
    { name: "Bronze", revenue: metrics.bronzeRevenue || 0 },
  ];

  const horizontalChartData = (data.customers || []).slice(0, 5).map((c: any) => ({
    name: c.name,
    revenue: c.spending,
  }));

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => <span className="font-semibold">{row.original.name}</span>,
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline" className={`font-semibold ${getBadgeColor(row.original.category)}`}>
            {row.original.category} Badge
          </Badge>
        ),
      },
      {
        accessorKey: "orders",
        header: "Orders",
        cell: ({ getValue }) => num(getValue() as number),
      },
      {
        accessorKey: "spending",
        header: "Store Spending",
        cell: ({ getValue }) => <span className="font-semibold">{inr(getValue() as number)}</span>,
      },
      {
        id: "aov",
        header: "AOV",
        cell: ({ row }) => {
          const spend = row.original.spending || 0;
          const ord = row.original.orders || 0;
          const aov = ord > 0 ? spend / ord : 0;
          return inr(aov);
        },
      },
      {
        accessorKey: "percentageContribution",
        header: "Contribution",
        cell: ({ getValue }) => `${getValue()}%`,
      },
      {
        accessorKey: "lastPurchase",
        header: "Last Order Date",
        cell: ({ getValue }) => getValue() ? shortDate(getValue() as string) : "Never",
      },
      { accessorKey: "city", header: "City" },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Customer Segmentation Directory"
        description="View and target specific customer cohorts classified by their spending totals under your business catalog."
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> Export CSV Report
            </Button>
            <Button variant="ghost" size="icon" onClick={async () => {
              await router.invalidate();
              toast.success("Segmentation refreshed");
            }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Interactive Segmentation filters */}
      <Card className="p-4 bg-muted/20 border-dashed space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Search Directory
            </label>
            <Input
              placeholder="Search customers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Tier</label>
            <Select
              value={searchParams.category}
              onValueChange={(v) => updateQuery({ category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Registered City</label>
            <Select
              value={searchParams.city}
              onValueChange={(v) => updateQuery({ city: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="w-full text-xs font-semibold h-10 text-muted-foreground hover:bg-secondary/40 border"
          >
            Clear Filters
          </Button>
        </div>

        {/* Spending range filters */}
        <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Minimum Spending Limit
            </label>
            <Input
              type="number"
              placeholder="Min spending"
              value={localMinSpend}
              onChange={(e) => setLocalMinSpend(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Maximum Spending Limit
            </label>
            <Input
              type="number"
              placeholder="Max spending"
              value={localMaxSpend}
              onChange={(e) => setLocalMaxSpend(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={handleApplySpending} className="gap-1 px-4 h-10">
            Apply Spending Filter
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total customers" value={num(metrics.totalCustomers || 0)} icon={Users} tone="primary" />
        <StatCard label="Gold Customers" value={num(metrics.goldCustomers || 0)} icon={Sparkles} tone="warning" />
        <StatCard label="Silver Customers" value={num(metrics.silverCustomers || 0)} icon={Users} tone="accent" />
        <StatCard label="Bronze Customers" value={num(metrics.bronzeCustomers || 0)} icon={Users} tone="primary" />
        <StatCard label="Highest spending" value={metrics.highestSpendingCustomer || "N/A"} icon={Sparkles} tone="info" />
        <StatCard label="Average spending" value={inr(metrics.averageSpending || 0)} icon={IndianRupee} tone="accent" />
      </div>

      {/* Recharts graphs grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Pie Chart */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Segment Distribution</div>
            <div className="text-xs text-muted-foreground mb-4">Customer counts per category tier</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {pieChartData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart: Revenue contribution */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Revenue Contribution</div>
            <div className="text-xs text-muted-foreground mb-4">Total revenue metrics generated per segment</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip {...tooltipStyle} />
                <Bar name="Revenue" dataKey="revenue" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Horizontal Bar Chart: Top customers spending */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Top Customers Spending</div>
            <div className="text-xs text-muted-foreground mb-4">Highest spending totals mapped horizontally</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={horizontalChartData} margin={{ left: 20, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="name" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Bar name="Spending" dataKey="revenue" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Paginated Segment Customer Table */}
      <Card className="p-5 space-y-4">
        <div>
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <Layers className="h-4.5 w-4.5 text-primary" />
            Customer Segment Matrix Directory
          </div>
          <p className="text-xs text-muted-foreground">List of customers classified into cohorts and categories</p>
        </div>

        <DataTable
          columns={columns}
          data={data.customers || []}
          pageCount={data.pagination?.pages || 1}
          pageIndex={(data.pagination?.page || 1) - 1}
          pageSize={data.pagination?.limit || 10}
          onPaginationChange={(updater) => {
            const nextState = typeof updater === "function" ? updater({ pageIndex: (data.pagination?.page || 1) - 1, pageSize: data.pagination?.limit || 10 }) : updater;
            navigate({
              search: (prev: any) => ({
                ...prev,
                page: nextState.pageIndex + 1,
                limit: nextState.pageSize,
              }),
            });
          }}
        />
      </Card>
    </div>
  );
}
