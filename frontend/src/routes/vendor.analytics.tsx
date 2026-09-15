import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { IndianRupee, Users, Package, Receipt, Warehouse, Sparkles, TrendingUp, Download, RefreshCw, Calendar } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatCard } from "@/components/dashboard/StatCard";
import { inr, num, shortDate } from "@/lib/format";
import api from "@/lib/api";

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

const tooltipStyle = {
  contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

const searchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional().catch("all"),
  city: z.string().optional().catch("all"),
  forecastDays: z.number().catch(30),
  historyDays: z.number().catch(30),
  search: z.string().optional().catch(""),
  page: z.number().catch(1),
  limit: z.number().catch(10),
});

export const Route = createFileRoute("/vendor/analytics")({
  validateSearch: (search: Record<string, unknown>) => {
    const s = search || {};
    return {
      startDate: (s.startDate as string) || undefined,
      endDate: (s.endDate as string) || undefined,
      category: (s.category as string) || "all",
      city: (s.city as string) || "all",
      forecastDays: Number(s.forecastDays || 30),
      historyDays: Number(s.historyDays || 30),
      search: (s.search as string) || "",
      page: Number(s.page || 1),
      limit: Number(s.limit || 10),
    };
  },
  loader: async ({ search = {} as any }) => {
    const params = new URLSearchParams();
    params.set("page", String(search.page || 1));
    params.set("limit", String(search.limit || 10));
    params.set("forecastDays", String(search.forecastDays || 30));
    params.set("historyDays", String(search.historyDays || 30));

    if (search.startDate) params.set("startDate", search.startDate);
    if (search.endDate) params.set("endDate", search.endDate);
    if (search.category && search.category !== "all") params.set("category", search.category);
    if (search.city && search.city !== "all") params.set("city", search.city);
    if (search.search) params.set("search", search.search);

    const res: any = await api.get(`/dashboard-analytics?${params.toString()}`);
    return {
      analytics: res.data,
    };
  },
  component: VendorAnalyticsDashboard,
});

function VendorAnalyticsDashboard() {
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
      search: (prev: any) => ({ ...prev, startDate: localStartDate || undefined, endDate: localEndDate || undefined, page: 1 }),
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStartDate("");
    setLocalEndDate("");
    navigate({
      search: () => ({
        startDate: undefined,
        endDate: undefined,
        category: "all",
        city: "all",
        forecastDays: 30,
        historyDays: 30,
        search: "",
        page: 1,
        limit: 10,
      }),
    });
  };

  const handleExportCSV = () => {
    try {
      const summary = data.analytics.summary || {};
      const headers = ["Metric", "Value"];
      const rows = [
        ["My Revenue", summary.totalRevenue],
        ["Products Sold", summary.productsSold],
        ["Total Products", summary.totalProducts],
        ["Total Customers", summary.totalCustomers],
        ["Total Transactions", summary.totalTransactions],
        ["Average Order Value", summary.averageOrderValue],
        ["Average Daily Sales", summary.averageDailySales],
        ["Inventory Coverage", summary.inventoryCoverage],
        ["Forecast Demand", summary.forecastDemand],
        ["Recommendation Coverage", summary.recommendationCoverage],
        ["Low Stock Items", summary.lowStockItems],
        ["Out Of Stock Items", summary.outOfStockItems],
      ];
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `ShopSense_MyStoreAnalytics_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV analytics summary report downloaded successfully");
    } catch (err) {
      toast.error("Failed to export analytics report");
    }
  };

  const handleExportExcel = () => {
    try {
      const summary = data.analytics.summary || {};
      const rows = [
        ["My Revenue", summary.totalRevenue],
        ["Products Sold", summary.productsSold],
        ["Total Products", summary.totalProducts],
        ["Total Customers", summary.totalCustomers],
        ["Total Transactions", summary.totalTransactions],
        ["Average Order Value", summary.averageOrderValue],
        ["Average Daily Sales", summary.averageDailySales],
        ["Inventory Coverage", summary.inventoryCoverage],
        ["Forecast Demand", summary.forecastDemand],
        ["Recommendation Coverage", summary.recommendationCoverage],
        ["Low Stock Items", summary.lowStockItems],
        ["Out Of Stock Items", summary.outOfStockItems],
      ];
      
      let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Store Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #4F81BD; color: white; font-weight: bold;">
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}
          </tbody>
        </table>
      </body>
      </html>`;
      
      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ShopSense_MyStoreAnalytics_${new Date().toISOString().split("T")[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel analytics summary report downloaded successfully");
    } catch (err) {
      toast.error("Failed to export Excel report");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const analytics = data.analytics || {};
  const summary = analytics.summary || {};

  // Formatted datasets for Recharts
  const revenueTrend = useMemo(() => {
    if (analytics.mlRevenue?.trends?.daily) {
      return analytics.mlRevenue.trends.daily.map((t: any) => ({
        date: shortDate(t.date),
        revenue: t.revenue,
      }));
    }
    return analytics.revenue?.dailyRevenue?.map((t: any) => ({
      date: shortDate(t.date),
      revenue: t.revenue,
    })) || [];
  }, [analytics.mlRevenue, analytics.revenue]);

  const customerGrowth = analytics.customer?.customerGrowth || [];
  
  const customerSegPie = useMemo(() => {
    if (analytics.mlCustomerIntelligence?.segments) {
      return analytics.mlCustomerIntelligence.segments.map((s: any) => ({
        name: s.segment,
        value: s.count,
      }));
    }
    return [
      { name: "Gold", value: analytics.customer?.segments?.goldCustomers || 0 },
      { name: "Silver", value: analytics.customer?.segments?.silverCustomers || 0 },
      { name: "Bronze", value: analytics.customer?.segments?.bronzeCustomers || 0 },
    ];
  }, [analytics.mlCustomerIntelligence, analytics.customer]);

  const topProducts = (analytics.product?.topSelling || []).slice(0, 5);
  const inventoryStatus = [
    { name: "Healthy", value: analytics.inventory?.healthyProducts || 0 },
    { name: "Low Stock", value: analytics.inventory?.lowStockProducts || 0 },
    { name: "Out of Stock", value: analytics.inventory?.outOfStockProducts || 0 },
  ];

  // Column definitions for inner tables
  const productColumns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "productName",
        header: "Product Name",
        cell: ({ row }) => <span className="font-semibold text-xs">{row.original.productName}</span>,
      },
      { accessorKey: "category", header: "Category" },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ getValue }) => inr(getValue() as number),
      },
      {
        accessorKey: "salesCount",
        header: "Units Sold",
        cell: ({ getValue }) => num(getValue() as number),
      },
      {
        accessorKey: "revenue",
        header: "Revenue",
        cell: ({ getValue }) => <span className="font-bold text-xs text-primary">{inr(getValue() as number)}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Store Performance Console"
        description="View granular analytics scoped to your products catalogue, sales transaction curves, inventory stockouts alerts, and repeat shoppers segments."
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5 print:hidden">
                  <Download className="h-4 w-4" /> Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>Export as Excel (.xls)</DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintPDF}>Print / Save as PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="print:hidden" onClick={async () => {
              await router.invalidate();
              toast.success("Store analytics updated");
            }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {/* Analytics dashboard query filters panel */}
      <Card className="p-4 bg-muted/20 border-dashed space-y-4">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Start Date
            </label>
            <Input
              type="date"
              value={localStartDate}
              onChange={(e) => setLocalStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> End Date
            </label>
            <Input
              type="date"
              value={localEndDate}
              onChange={(e) => setLocalEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category Filter</label>
            <Select
              value={searchParams.category}
              onValueChange={(v) => updateQuery({ category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Footwear">Footwear</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Home Decor">Home Decor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApplyDates} className="flex-1 h-10">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="h-10 text-xs px-3">
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary KPI stats cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="My Store revenue" value={inr(summary.totalRevenue || 0)} icon={IndianRupee} tone="emerald" />
        <StatCard label="Products Sold" value={num(summary.productsSold || 0)} icon={Package} tone="primary" />
        <StatCard label="My Customers" value={num(summary.totalCustomers || 0)} icon={Users} tone="accent" />
        <StatCard label="My Products" value={num(summary.totalProducts || 0)} icon={Package} tone="info" />
        <StatCard label="Store orders" value={num(summary.totalTransactions || 0)} icon={Receipt} tone="primary" />
        <StatCard label="Inventory Stock" value={num(summary.totalInventoryItems || 0)} icon={Warehouse} tone="accent" />
        <StatCard label="Average order value" value={inr(summary.averageOrderValue || 0)} icon={IndianRupee} tone="emerald" />
        <StatCard label="Forecast demand" value={num(summary.forecastDemand || 0)} icon={Sparkles} tone="warning" />
        <StatCard label="Recommendation coverage" value={`${summary.recommendationCoverage || 0}%`} icon={Sparkles} tone="info" />
        <StatCard label="Low/Out of Stock" value={`${summary.lowStockItems || 0} / ${summary.outOfStockItems || 0}`} icon={Warehouse} tone="warning" />
      </div>

      {/* Recharts widgets dashboards grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Revenue Trend Line */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="h-4.5 w-4.5 text-primary" /> Daily Revenue Trend</div>
            <div className="text-xs text-muted-foreground mb-4">Tracking dynamic paid store revenue timeline</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" name="Revenue" dataKey="revenue" stroke="var(--color-chart-1)" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Growth Line */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-primary" /> Customer Growth</div>
            <div className="text-xs text-muted-foreground mb-4">Total registrations timeline metrics</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" name="New Signups" dataKey="newCustomers" stroke="var(--color-chart-2)" strokeWidth={2} />
                <Line type="monotone" name="Cumulative Growth" dataKey="cumulative" stroke="var(--color-chart-3)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Inventory Status pie */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><Warehouse className="h-4.5 w-4.5 text-primary" /> Inventory Status Distribution</div>
            <div className="text-xs text-muted-foreground mb-4">Product health statistics divisions</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {inventoryStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Segmentation splits */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4.5 w-4.5 text-primary" /> Customer Cohorts Segments</div>
            <div className="text-xs text-muted-foreground mb-4">Pie distributions splits</div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerSegPie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {customerSegPie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ML Engine Forecasting Line Chart */}
      {analytics.mlForecast && (
        <Card className="p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5 text-primary">
              <Sparkles className="h-4.5 w-4.5" /> ML Engine Demand & Sales Forecast
            </div>
            <div className="text-xs text-muted-foreground">
              Serving predictions using active Production model version {analytics.mlForecast.model_metadata?.version} registered on {new Date(analytics.mlForecast.model_metadata?.training_date).toLocaleDateString("en-IN")}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.mlForecast.salesForecast.map((s: any, idx: number) => ({
                date: shortDate(s.date),
                sales: s.prediction,
                demand: analytics.mlForecast.demandForecast[idx]?.prediction || 0,
                inventory: analytics.mlForecast.inventoryForecast[idx]?.prediction || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" name="Predicted Sales" dataKey="sales" stroke="var(--color-chart-1)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Predicted Demand" dataKey="demand" stroke="var(--color-chart-2)" strokeWidth={2} />
                <Line type="monotone" name="Stock Coverage Target" dataKey="inventory" stroke="var(--color-chart-3)" strokeWidth={1.5} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Grids containing top products table */}
      <Card className="p-5 space-y-4">
        <div className="font-semibold text-sm">Top Selling Products</div>
        <DataTable columns={productColumns} data={topProducts} pageCount={1} pageIndex={0} pageSize={5} />
      </Card>
    </div>
  );
}
