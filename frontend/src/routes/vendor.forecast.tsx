import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, RefreshCw, Sparkles, TrendingUp, AlertTriangle, BatteryMedium, Package } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { num, shortDate } from "@/lib/format";
import api from "@/lib/api";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books", "Toys", "Grocery"];

const searchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(100),
  search: z.string().optional().catch(""),
  category: z.string().optional().catch("all"),
  status: z.string().optional().catch("all"),
  forecastDays: z.number().catch(30),
  historyDays: z.number().catch(30),
  sortBy: z.string().catch("forecastDemand"),
  sortOrder: z.enum(["asc", "desc"]).catch("desc"),
});

export const Route = createFileRoute("/vendor/forecast")({
  validateSearch: (search: Record<string, unknown>) => {
    const s = search || {};
    return {
      page: Number(s.page || 1),
      limit: Number(s.limit || 100),
      search: (s.search as string) || "",
      category: (s.category as string) || "all",
      status: (s.status as string) || "all",
      forecastDays: Number(s.forecastDays || 30),
      historyDays: Number(s.historyDays || 30),
      sortBy: (s.sortBy as string) || "forecastDemand",
      sortOrder: ((s.sortOrder as string) || "desc") as "asc" | "desc",
    };
  },
  loader: async ({ search = {} as any }) => {
    const params = new URLSearchParams();
    params.set("forecastDays", String(search.forecastDays || 30));
    params.set("historyDays", String(search.historyDays || 30));
    params.set("limit", String(search.limit || 100));
    params.set("page", String(search.page || 1));
    params.set("sortBy", search.sortBy || "forecastDemand");
    params.set("sortOrder", search.sortOrder || "desc");
    
    if (search.search) params.set("search", search.search);
    if (search.category && search.category !== "all") params.set("category", search.category);
    if (search.status && search.status !== "all") params.set("status", search.status);

    const res: any = await api.get(`/forecast?${params.toString()}`);
    let payload = res;
    if (res && res.data) {
      if (res.data.forecasts) {
        payload = res.data;
      } else if (res.data.data && res.data.data.forecasts) {
        payload = res.data.data;
      }
    }
    return {
      forecasts: payload?.forecasts || [],
      metadata: payload?.metadata || {
        generatedAt: new Date().toISOString(),
        forecastDays: search.forecastDays || 30,
        historyDays: search.historyDays || 30,
        totalProducts: 0,
        totalForecastDemand: 0,
        averageForecastDemand: 0,
        page: search.page || 1,
        pages: 1,
        limit: search.limit || 100,
      }
    };
  },
  component: VendorForecastPage,
});

function VendorForecastPage() {
  const router = useRouter();
  const searchParams = Route.useSearch() || {};
  const { forecasts = [], metadata = {} as any } = Route.useLoaderData() || {};
  const navigate = useNavigate({ from: Route.fullPath });

  const [localSearch, setLocalSearch] = useState(searchParams.search || "");

  const updateQuery = (updates: Partial<z.infer<typeof searchSchema>>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates, page: 1 }),
    });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchParams.search) {
        updateQuery({ search: localSearch });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch]);

  const totalForecastDemand = metadata.totalForecastDemand || 0;
  const avgDailySales = useMemo(() => {
    const sum = forecasts.reduce((s: number, f: any) => s + (f.averageSalesPerDay || 0), 0);
    return parseFloat(sum.toFixed(2));
  }, [forecasts]);

  const productsAtRisk = useMemo(() => {
    return forecasts.filter((f: any) => f.forecastStatus === "Low Stock Risk" || f.forecastStatus === "Out of Stock Risk").length;
  }, [forecasts]);

  const outOfStockForecasts = useMemo(() => {
    return forecasts.filter((f: any) => f.forecastStatus === "Out of Stock Risk").length;
  }, [forecasts]);

  const handleRefresh = async () => {
    toast.promise(router.invalidate(), {
      loading: "Refreshing sales velocity forecasts...",
      success: "Forecast updated!",
      error: "Failed to reload forecast.",
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        "Product Name",
        "SKU",
        "Category",
        "Current Stock",
        "Average Sales/Day",
        "Forecast Demand",
        "Suggested Reorder Qty",
        "Estimated Remaining Days",
        "Coverage Status",
        "Last Updated"
      ];
      
      const rows = forecasts.map((f: any) => [
        f.productName,
        f.sku,
        f.category,
        f.currentStock,
        f.averageSalesPerDay,
        f.forecastDemand,
        f.suggestedReorderQuantity,
        f.estimatedRemainingDays !== null ? f.estimatedRemainingDays : "Infinite",
        f.forecastStatus,
        shortDate(f.lastUpdated)
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `ShopSense_MyForecast_${searchParams.forecastDays}Days.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV report downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate CSV");
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image || "https://picsum.photos/seed/default/100"} className="h-9 w-9 rounded-md object-cover border bg-secondary/10" />
          <div className="min-w-0">
            <div className="font-medium truncate">{row.original.productName}</div>
            <span className="text-[10px] text-muted-foreground uppercase">{row.original.category}</span>
          </div>
        </div>
      ),
    },
    { accessorKey: "sku", header: "SKU" },
    { accessorKey: "currentStock", header: "Stock", cell: ({ getValue }) => num(getValue() as number) },
    { accessorKey: "averageSalesPerDay", header: "Avg Sales/Day", cell: ({ getValue }) => (getValue() as number).toFixed(2) },
    { accessorKey: "forecastDemand", header: `Demand (${searchParams.forecastDays}d)` },
    { accessorKey: "suggestedReorderQuantity", header: "Suggested Reorder" },
    {
      accessorKey: "estimatedRemainingDays",
      header: "Days Remaining",
      cell: ({ getValue }) => {
        const v = getValue();
        return v === null ? <span className="text-muted-foreground italic">Infinite</span> : `${v} days`;
      }
    },
    {
      id: "status",
      header: "Risk Status",
      cell: ({ row }) => {
        const s = row.original.forecastStatus;
        if (s === "Out of Stock Risk") return <Badge variant="destructive">Out of Stock Risk</Badge>;
        if (s === "Low Stock Risk") return <Badge className="bg-warning/20 text-warning-foreground hover:bg-warning/30 border-warning/20">Low Stock Risk</Badge>;
        return <Badge variant="secondary">Healthy</Badge>;
      }
    },
    { accessorKey: "lastUpdated", header: "Updated", cell: ({ getValue }) => shortDate(getValue() as string) }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Inventory Forecasting"
        description="Predict demand, estimate stock exhaust dates, and optimize stock levels."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      {/* Summary Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Predicted Gross Demand" value={num(totalForecastDemand)} icon={TrendingUp} tone="primary" />
        <StatCard label="Products At Risk" value={num(productsAtRisk)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Out of Stock Alerts" value={num(outOfStockForecasts)} icon={BatteryMedium} tone="destructive" />
        <StatCard label="Sales Daily velocity" value={`${avgDailySales} units`} icon={Sparkles} tone="info" />
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Forecast Parameters:</div>

        {/* Forecast Period */}
        <div className="w-[150px]">
          <Select value={String(searchParams.forecastDays)} onValueChange={(val) => updateQuery({ forecastDays: parseInt(val) })}>
            <SelectTrigger>
              <SelectValue placeholder="30 Days Forecast" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days Prediction</SelectItem>
              <SelectItem value="30">30 Days Prediction</SelectItem>
              <SelectItem value="60">60 Days Prediction</SelectItem>
              <SelectItem value="90">90 Days Prediction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History Period */}
        <div className="w-[160px]">
          <Select value={String(searchParams.historyDays)} onValueChange={(val) => updateQuery({ historyDays: parseInt(val) })}>
            <SelectTrigger>
              <SelectValue placeholder="30 Days History" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days Sales</SelectItem>
              <SelectItem value="14">Last 14 Days Sales</SelectItem>
              <SelectItem value="30">Last 30 Days Sales</SelectItem>
              <SelectItem value="90">Last 90 Days Sales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search input field */}
        <div className="w-[200px]">
          <Input placeholder="Search catalog..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />
        </div>

        {/* Category Filter */}
        <div className="w-[140px]">
          <Select value={searchParams.category} onValueChange={(val) => updateQuery({ category: val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[150px]">
          <Select value={searchParams.status} onValueChange={(val) => updateQuery({ status: val })}>
            <SelectTrigger>
              <SelectValue placeholder="All Risk Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Healthy">Healthy</SelectItem>
              <SelectItem value="Low Stock Risk">Low Stock Risk</SelectItem>
              <SelectItem value="Out of Stock Risk">Out of Stock Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchParams.search || searchParams.category !== "all" || searchParams.status !== "all" || searchParams.forecastDays !== 30 || searchParams.historyDays !== 30) && (
          <Button variant="ghost" size="sm" onClick={() => { setLocalSearch(""); navigate({ search: () => ({}) }); }} className="text-xs">
            Reset Filters
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground italic flex items-center justify-end gap-1">
        Generated at: {new Date(metadata.generatedAt).toLocaleString()}
      </div>

      {forecasts.length > 0 ? (
        <DataTable
          columns={columns}
          data={forecasts}
          searchKeys={[]}
          searchPlaceholder=""
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed text-center p-6 bg-card">
          <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-semibold">No forecasts match selected filters</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search criteria or changing the historical velocity sales window.
          </p>
        </div>
      )}
    </div>
  );
}
