import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Package, IndianRupee, Receipt, AlertTriangle, Store, Plus, FileBarChart, ArrowRight, TrendingUp, Sparkles, UserCheck, MessageSquare, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { inr, num, shortDate } from "@/lib/format";
import { RevenueAreaChart, VendorSalesBarChart, CategoryPieChart, OrdersLineChart } from "@/components/charts/AnalyticsCharts";
import api from "@/lib/api";

export const Route = createFileRoute("/admin/dashboard")({
  loader: async () => {
    try {
      const [analyticsRes, txRes, productsRes] = await Promise.all([
        api.get("/dashboard-analytics").catch(() => ({ data: {} })),
        api.get("/transactions?limit=6").catch(() => ({ data: { transactions: [] } })),
        api.get("/products?limit=100").catch(() => ({ data: { products: [] } }))
      ]);
      return {
        analytics: (analyticsRes as any).data || {},
        recentTransactions: (txRes as any).data?.transactions || [],
        products: (productsRes as any).data?.products || []
      };
    } catch (e) {
      console.error("Dashboard loader error:", e);
      return {
        analytics: {},
        recentTransactions: [],
        products: []
      };
    }
  },
  component: AdminDashboard
});

function AdminDashboard() {
  const { user } = useAuth();
  const { analytics = {} as any, recentTransactions = [], products = [] } = Route.useLoaderData() || {};

  const [shipmentsStats, setShipmentsStats] = useState({ total: 0, delivered: 0, failed: 0 });
  const [supportStats, setSupportStats] = useState({ total: 0, open: 0, resolved: 0 });
  const [invoiceStats, setInvoiceStats] = useState({ total: 0, amount: 0 });

  useEffect(() => {
    async function loadAdminFulfillmentAndSupport() {
      try {
        const [shpRes, supRes, invRes] = await Promise.all([
          api.get("/shipments").catch(() => ({ data: [] })),
          api.get("/support").catch(() => ({ data: [] })),
          api.get("/invoices").catch(() => ({ data: [] })),
        ]);
        const shp = shpRes.data || [];
        const sup = supRes.data || [];
        const inv = invRes.data || [];

        setShipmentsStats({
          total: shp.length,
          delivered: shp.filter((s: any) => s.shipmentStatus === "Delivered").length,
          failed: shp.filter((s: any) => s.shipmentStatus === "Failed").length,
        });

        setSupportStats({
          total: sup.length,
          open: sup.filter((t: any) => t.status !== "Closed" && t.status !== "Resolved").length,
          resolved: sup.filter((t: any) => t.status === "Closed" || t.status === "Resolved").length,
        });

        setInvoiceStats({
          total: inv.length,
          amount: inv.reduce((sum: number, i: any) => sum + i.totalAmount, 0),
        });
      } catch (e) {
        console.error("Failed to load admin fulfillment stats:", e);
      }
    }
    loadAdminFulfillmentAndSupport();
  }, []);

  const totalRevenue = analytics?.summary?.totalRevenue || 0;
  const active = analytics?.vendor?.totalActiveVendors || 0;
  const lowStock = analytics?.summary?.lowStockItems || 0;
  const totalVendors = analytics?.summary?.totalVendors || 0;
  const totalProducts = analytics?.summary?.totalProducts || 0;
  const totalTransactions = analytics?.summary?.totalTransactions || 0;

  const recentTx = recentTransactions || [];
  const topProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  const lowStockList = [...products].filter((p) => p.stock < (p.reorderLevel || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Admin"}`}
        description="Here's what's happening across your marketplace today."
        actions={
          <>
            <Button asChild><Link to="/admin/vendors/new"><Plus className="mr-1.5 h-4 w-4" /> Add vendor</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total vendors" value={num(totalVendors)} delta={8.4} icon={Store} tone="primary" index={0} />
        <StatCard label="Active vendors" value={num(active)} delta={4.2} icon={Users} tone="accent" index={1} />
        <StatCard label="Total products" value={num(totalProducts)} delta={12.1} icon={Package} tone="primary" index={2} />
        <StatCard label="Total revenue" value={inr(totalRevenue)} delta={18.6} icon={IndianRupee} tone="accent" index={3} />
        <StatCard label="Transactions" value={num(totalTransactions)} delta={-2.4} icon={Receipt} tone="primary" index={4} />
        <StatCard label="Low stock" value={num(lowStock)} delta={-6.1} icon={AlertTriangle} tone="warning" index={5} />
      </div>

      {/* Fulfillment & Support Summary */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <StatCard label="Global Shipments" value={num(shipmentsStats.total)} icon={Package} tone="primary" />
        <StatCard label="Invoiced Total" value={inr(invoiceStats.amount)} icon={IndianRupee} tone="accent" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Total Customers" value={num(analytics?.customer?.totalCustomers || 0)} icon={Users} tone="primary" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Customer Revenue" value={inr(analytics?.summary?.totalRevenue || 0)} icon={IndianRupee} tone="accent" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Average Spending" value={inr(analytics?.customer?.averageSpending || 0)} icon={IndianRupee} tone="accent" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Average Order Value" value={inr(analytics?.customer?.averageOrderValue || 0)} icon={Receipt} tone="primary" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Top Customer" value={analytics?.customer?.highestSpendingCustomer || "N/A"} icon={Sparkles} tone="info" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Repeat Customers" value={num(analytics?.customer?.repeatCustomers || 0)} icon={Users} tone="primary" />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Customer Growth" value={analytics?.customer?.customerGrowth !== undefined && typeof analytics?.customer?.customerGrowth === "number" ? `${analytics.customer.customerGrowth}%` : "0%"} icon={TrendingUp} tone={analytics?.customer?.customerGrowth >= 0 ? "primary" : "warning"} />
        </Link>
        <Link to="/admin/customer-analytics" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Latest Customer" value={analytics?.customer?.highestSpendingCustomer || "N/A"} icon={UserCheck} tone="info" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Link to="/admin/customer-segmentation" className="block transition-transform hover:scale-[1.01]">
          <StatCard 
            label="Top Segment" 
            value={
              (analytics.customer?.segments?.goldCustomers || 0) >= Math.max(analytics.customer?.segments?.silverCustomers || 0, analytics.customer?.segments?.bronzeCustomers || 0)
                ? "Gold"
                : (analytics.customer?.segments?.silverCustomers || 0) >= (analytics.customer?.segments?.bronzeCustomers || 0)
                ? "Silver"
                : "Bronze"
            } 
            icon={TrendingUp} 
            tone="info" 
          />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/admin/recommendations" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Most Recommended Product" value={analytics.recommendation?.mostRecommendedProduct || "N/A"} icon={Sparkles} tone="warning" />
        </Link>
        <Link to="/admin/recommendations" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Trending Product" value={analytics.recommendation?.topTrendingProduct || "N/A"} icon={TrendingUp} tone="info" />
        </Link>
        <Link to="/admin/recommendations" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Customers Receiving Recommendations" value={num(analytics.recommendation?.customersWithRecommendations || 0)} icon={Users} tone="primary" />
        </Link>
        <Link to="/admin/recommendations" className="block transition-transform hover:scale-[1.01]">
          <StatCard label="Recommendation Coverage" value={`${analytics.recommendation?.recommendationCoverage || 0}%`} icon={Sparkles} tone="accent" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueAreaChart data={analytics.revenue?.monthlyRevenue || []} />
        <VendorSalesBarChart data={(analytics.vendor?.performance || []).map((v: any) => ({ name: v.businessName || "Unknown", revenue: v.revenue }))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPieChart data={analytics.product?.categoryDistribution || []} />
        <OrdersLineChart data={analytics.revenue?.monthlyRevenue || []} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div><div className="text-sm font-semibold">Recent transactions</div><div className="text-xs text-muted-foreground">Latest paid & pending orders</div></div>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/transactions">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          <div className="divide-y divide-border">
            {recentTx.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-xs font-semibold">{t.customer.split(" ").map((n) => n[0]).join("")}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.orderNo} · {t.customer}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.productName} · {t.vendorName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{inr(t.amount)}</div>
                  <div className="text-[10px] text-muted-foreground">{shortDate(t.date)}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold">Activity feed</div>
          <ul className="space-y-3">
            {(analytics?.activityFeed || []).map((a: any) => (
              <li key={a.id} className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm">{a.message}</div><div className="text-[11px] text-muted-foreground">{a.time}</div></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Top selling products</div>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/products">View all</Link></Button>
          </div>
          <div className="space-y-3">
            {topProducts.map((p) => (
              <Link key={p.id} to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.vendorName}</div>
                </div>
                <div className="text-right"><div className="text-sm font-semibold">{num(p.sales)}</div><div className="text-[10px] text-muted-foreground">units</div></div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Inventory alerts</div>
            <Button variant="ghost" size="sm" asChild><Link to="/admin/inventory">Manage</Link></Button>
          </div>
          <div className="space-y-2">
            {lowStockList.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">Reorder at {p.reorderLevel}</div></div>
                <div className="text-right"><div className="text-sm font-semibold text-warning-foreground">{p.stock} left</div></div>
              </div>
            ))}
            {lowStockList.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No inventory alerts. All stock levels are healthy!
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
