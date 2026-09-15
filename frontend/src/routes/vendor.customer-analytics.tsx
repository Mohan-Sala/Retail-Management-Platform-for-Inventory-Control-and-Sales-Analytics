import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Users, IndianRupee, Receipt, AlertTriangle, Store, Plus, FileBarChart, Download, Search, RefreshCw, Sparkles, TrendingUp, Calendar, MapPin, BadgeCheck } from "lucide-react";
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
const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

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
  startDate: z.string().optional().catch(""),
  endDate: z.string().optional().catch(""),
  sortBy: z.string().catch("revenue"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
});

export const Route = createFileRoute("/vendor/customer-analytics")({
  validateSearch: (search: Record<string, unknown>) => {
    const s = search || {};
    return {
      page: Number(s.page || 1),
      limit: Number(s.limit || 10),
      search: (s.search as string) || "",
      category: (s.category as string) || "all",
      city: (s.city as string) || "all",
      startDate: (s.startDate as string) || "",
      endDate: (s.endDate as string) || "",
      sortBy: (s.sortBy as string) || "revenue",
      sortOrder: ((s.sortOrder as string) || "desc") as "asc" | "desc",
    };
  },
  loader: async ({ search = {} as any }) => {
    const params = new URLSearchParams();
    params.set("page", String(search.page || 1));
    params.set("limit", String(search.limit || 10));
    params.set("sortBy", search.sortBy || "revenue");
    params.set("sortOrder", search.sortOrder || "desc");

    if (search.search) params.set("search", search.search);
    if (search.category && search.category !== "all") params.set("category", search.category);
    if (search.city && search.city !== "all") params.set("city", search.city);
    if (search.startDate) params.set("startDate", search.startDate);
    if (search.endDate) params.set("endDate", search.endDate);

    const res: any = await api.get(`/customer-analytics?${params.toString()}`);
    return res.data;
  },
  component: VendorCustomerAnalytics,
});

function VendorCustomerAnalytics() {
  const router = useRouter();
  // @ts-ignore
  const searchParams = Route.useSearch() || {};
  const data = Route.useLoaderData() || {};
  const navigate = useNavigate({ from: Route.fullPath });

  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [localStartDate, setLocalStartDate] = useState(searchParams.startDate || "");
  const [localEndDate, setLocalEndDate] = useState(searchParams.endDate || "");

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

  const handleApplyDates = () => {
    navigate({
      search: (prev: any) => ({ ...prev, startDate: localStartDate, endDate: localEndDate, page: 1 }),
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStartDate("");
    setLocalEndDate("");
    navigate({
      search: () => ({
        page: 1,
        limit: 10,
        search: "",
        category: "all",
        city: "all",
        startDate: "",
        endDate: "",
        sortBy: "revenue",
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
      const headers = ["Name", "Orders Count", "Revenue Sum", "Average Order Value", "Segment Tier", "Last Purchase Date"];
      const rows = (data.topCustomers || []).map((c: any) => [
        `"${c.name}"`,
        c.orders,
        c.revenue,
        c.averageOrderValue,
        c.category,
        c.lastPurchase ? new Date(c.lastPurchase).toISOString().split("T")[0] : "Never",
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `ShopSense_MyCustomerAnalytics_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV report downloaded successfully");
    } catch (err) {
      toast.error("Failed to export vendor customer details");
    }
  };

  const segmentChartData = (data.categoryDistribution || []).map((cd: any) => ({
    name: cd.category,
    value: cd.count,
  }));

  const cityChartData = (data.cityAnalytics || []).slice(0, 6).map((ca: any) => ({
    name: ca.city,
    revenue: ca.revenue,
    customers: ca.customerCount,
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
        header: "Tier",
        cell: ({ row }) => (
          <Badge variant="outline" className={`font-semibold ${getBadgeColor(row.original.category)}`}>
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: "orders",
        header: "Orders",
        cell: ({ getValue }) => num(getValue() as number),
      },
      {
        accessorKey: "revenue",
        header: "Total Value",
        cell: ({ getValue }) => <span className="font-medium">{inr(getValue() as number)}</span>,
      },
      {
        accessorKey: "averageOrderValue",
        header: "AOV",
        cell: ({ getValue }) => inr(getValue() as number),
      },
      {
        accessorKey: "lastPurchase",
        header: "Last Order Date",
        cell: ({ getValue }) => getValue() ? shortDate(getValue() as string) : "Never",
      },
    ],
    []
  );

  const cards = data.summaryCards || {};

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Customer Analytics Directory"
        description="Monitor cohort statistics, category volumes, registered city breakdowns, and growth ratios scoped for your business."
        actions={
          <>
            <Button variant="outline" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> Export CSV Report
            </Button>
            <Button variant="ghost" size="icon" onClick={async () => {
              await router.invalidate();
              toast.success("Metrics refreshed");
            }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Analytics filter box */}
      <Card className="p-4 bg-muted/20 border-dashed space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" /> Text Query (Name, Phone, Email)
            </label>
            <Input
              placeholder="Search directory..."
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
                <SelectItem value="Gold">Gold Member</SelectItem>
                <SelectItem value="Silver">Silver Member</SelectItem>
                <SelectItem value="Bronze">Bronze Member</SelectItem>
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

        {/* Date Filters grid */}
        <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Start Order Date
            </label>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> End Order Date
            </label>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={handleApplyDates} className="gap-1 px-4 h-10">
            Apply Date Range
          </Button>
        </div>
      </Card>

      {/* Analytics Summary Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
        <StatCard label="Total customers" value={num(cards.totalCustomers || 0)} delta={4.2} icon={Users} tone="primary" />
        <StatCard label="Active buyers" value={num(cards.activeCustomers || 0)} delta={2.1} icon={BadgeCheck} tone="accent" />
        <StatCard label="New signups" value={num(cards.newCustomers || 0)} delta={12.4} icon={Plus} tone="primary" />
        <StatCard label="Repeat customers" value={num(cards.repeatCustomers || 0)} delta={8.5} icon={Users} tone="accent" />
        <StatCard label="Total Spending" value={inr(cards.totalCustomerRevenue || 0)} delta={18.6} icon={IndianRupee} tone="primary" />
        <StatCard label="Average Spending" value={inr(cards.averageCustomerSpending || 0)} delta={6.3} icon={IndianRupee} tone="accent" />
        <StatCard label="Average Order Value" value={inr(cards.averageOrderValue || 0)} delta={-1.4} icon={Receipt} tone="primary" />
        <StatCard label="Top Customer" value={cards.highestSpendingCustomer || "N/A"} icon={Sparkles} tone="info" />
      </div>

      {/* Cohort Charts Row 1 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Category distribution */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Tier Distribution</div>
            <div className="text-xs text-muted-foreground mb-4">Percentage breakdown of customer segments</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {segmentChartData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Purchases Area */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Monthly Purchase Trend</div>
            <div className="text-xs text-muted-foreground mb-4">Customer order count volume & spending trends</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyPurchaseTrend || []} margin={{ left: -10, right: 10, top: 5 }}>
                <defs>
                  <linearGradient id="revenueGV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" name="Spending" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#revenueGV)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Cohort Charts Row 2 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Cumulative customer growth */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Customer growth curve</div>
            <div className="text-xs text-muted-foreground mb-4">Cumulative registration curve and new sign-ups</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyGrowth || []} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" name="Total Customers" dataKey="totalCustomers" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" name="New Customer Sign-ups" dataKey="newCustomers" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by city */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">City contribution breakdown</div>
            <div className="text-xs text-muted-foreground mb-4">Customer spending contribution per city</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityChartData} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis tickLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip {...tooltipStyle} />
                <Bar name="Spending" dataKey="revenue" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Analytics Data Breakdown Grid */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        {/* Top customers Table list */}
        <Card className="p-5 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Top Customers</div>
              <div className="text-xs text-muted-foreground">List of customers with highest spending totals with your store</div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={data.topCustomers || []}
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

        {/* CLV & Repeat shopper matrix Card */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              Customer Lifetime Value (CLV)
            </div>
            <p className="text-xs text-muted-foreground">Projected revenue metric calculations based on purchasing indices</p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="border rounded-md p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Revenue</span>
                <div className="font-bold text-sm">{inr(data.clvAnalytics?.totalSpending || 0)}</div>
              </div>
              <div className="border rounded-md p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Orders count</span>
                <div className="font-bold text-sm">{num(data.clvAnalytics?.orders || 0)}</div>
              </div>
              <div className="border rounded-md p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Average Order (AOV)</span>
                <div className="font-bold text-sm">{inr(data.clvAnalytics?.averageOrderValue || 0)}</div>
              </div>
              <div className="border rounded-md p-3 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">CLV Forecast</span>
                <div className="font-bold text-sm text-primary">{inr(data.clvAnalytics?.customerLifetimeValue || 0)}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Repeat Purchase Analysis
            </div>
            <p className="text-xs text-muted-foreground">Breakdown of cohort retention and repeat order frequencies</p>
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">First-Time Customer Ratio</span>
                <span className="font-bold">{num(data.repeatPurchaseAnalysis?.firstTimeCustomers || 0)} buyers</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Repeat Buyer Count</span>
                <span className="font-bold">{num(data.repeatPurchaseAnalysis?.repeatCustomers || 0)} buyers</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Repeat Purchase Rate</span>
                <Badge variant="secondary" className="font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  {data.repeatPurchaseAnalysis?.repeatPurchaseRate || 0}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Repeat Purchases</span>
                <span className="font-bold">{data.repeatPurchaseAnalysis?.averageRepeatOrders || 0} orders</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
