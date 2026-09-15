import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, IndianRupee, Receipt, Boxes, AlertTriangle, TrendingUp, Plus, FileBarChart, LineChart, Sparkles, UserCheck, MessageSquare, Users, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RevenueAreaChart, CategoryPieChart, OrdersLineChart } from "@/components/charts/AnalyticsCharts";
import { inr, num, shortDate } from "@/lib/format";
import { useVendorScope } from "@/hooks/useVendorScope";
import { toast } from "sonner";
import api from "@/lib/api";

export const Route = createFileRoute("/vendor/dashboard")({ component: VendorDashboard });

function VendorDashboard() {
  const { user } = useAuth();
  const { products, orders, inventory, revenueByMonth } = useVendorScope();

  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res: any = await api.get("/dashboard-analytics");
        setDashboardMetrics(res.data);
      } catch (err) {
        console.error("Failed to load analytics metrics for vendor dashboard:", err);
      }
    }
    loadMetrics();
  }, [inventory, orders]);

  const revenue = orders.filter((o) => o.status === "paid").reduce((s, t) => s + t.amount, 0);
  const available = inventory.reduce((s, i) => s + i.stock, 0);
  const low = inventory.filter((i) => i.stock < i.reorderLevel).length;
  const monthly = orders.filter((o) => Date.now() - +new Date(o.date) < 30 * 86400000).length;
  const catCounts = Array.from(new Set(products.map((p) => p.category))).map((c) => ({ name: c, value: products.filter((p) => p.category === c).length }));
  const topSelling = [...products].sort((a, b) => b.sales - a.sales).slice(0, 5);
  const recentOrders = [...orders].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Vendor"}`}
        description={`Here's how ${user?.businessName ?? "your store"} is performing.`}
        actions={
          <>
            <Button variant="outline" asChild><Link to="/vendor/reports"><FileBarChart className="mr-1.5 h-4 w-4" /> Reports</Link></Button>
            <Button asChild><Link to="/vendor/products/new"><Plus className="mr-1.5 h-4 w-4" /> Add product</Link></Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total products" value={num(products.length)} delta={5.4} icon={Package} tone="primary" index={0} />
        <StatCard label="Revenue" value={inr(revenue)} delta={14.2} icon={IndianRupee} tone="accent" index={1} />
        <StatCard label="Total orders" value={num(orders.length)} delta={7.1} icon={Receipt} tone="primary" index={2} />
        <StatCard label="Available stock" value={num(available)} delta={-1.4} icon={Boxes} tone="accent" index={3} />
        <StatCard label="Low stock" value={num(low)} delta={-8.2} icon={AlertTriangle} tone="warning" index={4} />
        <StatCard label="Monthly orders" value={num(monthly)} delta={9.6} icon={TrendingUp} tone="primary" index={5} />
      </div>

      {dashboardMetrics && (
        <>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Total Customers" value={num(dashboardMetrics.summary?.totalCustomers || 0)} icon={Users} tone="primary" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Customer Revenue" value={inr(dashboardMetrics.summary?.totalRevenue || 0)} icon={IndianRupee} tone="accent" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Average Spending" value={inr(dashboardMetrics.summary?.averageCustomerSpending || 0)} icon={IndianRupee} tone="accent" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Average Order Value" value={inr(dashboardMetrics.summary?.averageOrderValue || 0)} icon={Receipt} tone="primary" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Top Customer" value={dashboardMetrics.customer?.highestSpendingCustomer || "N/A"} icon={Sparkles} tone="info" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Repeat Customers" value={num(dashboardMetrics.customer?.repeatCustomers || 0)} icon={Users} tone="primary" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Customer Growth" value={`${dashboardMetrics.customer?.segments?.distributionPercentages?.Gold || 0}%`} icon={TrendingUp} tone="primary" />
            </Link>
            <Link to="/vendor/customer-analytics" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Latest Customer" value={dashboardMetrics.customer?.highestSpendingCustomer || "N/A"} icon={UserCheck} tone="info" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/vendor/customer-segmentation" className="block transition-transform hover:scale-[1.01]">
              <StatCard 
                label="Top Segment" 
                value={
                  (dashboardMetrics.customer?.segments?.goldCustomers || 0) >= Math.max(dashboardMetrics.customer?.segments?.silverCustomers || 0, dashboardMetrics.customer?.segments?.bronzeCustomers || 0)
                    ? "Gold"
                    : (dashboardMetrics.customer?.segments?.silverCustomers || 0) >= (dashboardMetrics.customer?.segments?.bronzeCustomers || 0)
                    ? "Silver"
                    : "Bronze"
                } 
                icon={TrendingUp} 
                tone="info" 
              />
            </Link>
            <Link to="/vendor/recommendations" className="block transition-transform hover:scale-[1.01]">
              <StatCard label="Trending Product" value={dashboardMetrics.recommendation?.topTrendingProduct || "N/A"} icon={TrendingUp} tone="info" />
            </Link>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueAreaChart data={revenueByMonth} />
        <OrdersLineChart data={revenueByMonth} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><CategoryPieChart data={catCounts.length ? catCounts : [{ name: "None", value: 1 }]} /></div>
        <Card className="p-5">
          <div className="mb-4 text-sm font-semibold">Quick actions</div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/vendor/products/new">Add product</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to="/vendor/inventory">Update stock</Link></Button>
            <Button variant="outline" size="sm" asChild><Link to="/vendor/reports">Generate report</Link></Button>
            <Button variant="outline" size="sm" onClick={() => toast.success("Analytics opened")}><LineChart className="mr-1 h-4 w-4" /> Analytics</Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Recent orders</div>
            <Button size="sm" variant="ghost" asChild><Link to="/vendor/orders">View all</Link></Button>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((o) => (
              <Link key={o.id} to="/vendor/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 hover:bg-muted/50">
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{o.orderNo}</div><div className="truncate text-xs text-muted-foreground">{o.customer} · {shortDate(o.date)}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{inr(o.amount)}</div></div>
                <StatusBadge status={o.status} />
              </Link>
            ))}
            {recentOrders.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No orders yet</div>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-semibold">Top selling products</div>
            <Button size="sm" variant="ghost" asChild><Link to="/vendor/products">Manage</Link></Button>
          </div>
          <div className="space-y-2">
            {topSelling.map((p) => (
              <Link key={p.id} to="/vendor/products/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                <img src={p.image} className="h-10 w-10 rounded-md object-cover" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{p.category}</div></div>
                <div className="text-right"><div className="text-sm font-semibold">{num(p.sales)}</div><div className="text-[10px] text-muted-foreground">units</div></div>
              </Link>
            ))}
            {topSelling.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No products yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}
