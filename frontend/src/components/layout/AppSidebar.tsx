import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, Store, Package, Warehouse, Receipt, FileBarChart, User, Settings, LogOut, ShoppingBag, Sparkles, Users, LineChart, PieChart, Bell, TrendingUp, Lightbulb, Activity, ShoppingCart, Heart, RefreshCw, Ticket, Award, BarChart2, MessageSquare, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { SearchCommandPalette } from "../common/SearchCommandPalette";
import { ThemeSwitcher } from "../common/ThemeSwitcher";
const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/vendors", label: "Vendors", icon: Store },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/customer-analytics", label: "Customer Analytics", icon: LineChart },
  { to: "/admin/customer-segmentation", label: "Customer Segmentation", icon: PieChart },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { to: "/admin/forecast", label: "Forecast", icon: Sparkles },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/business-insights", label: "Business Insights", icon: Lightbulb },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/system-audit", label: "Activity Logs", icon: Activity },
  { to: "/admin/users", label: "Users", icon: User },
  { to: "/admin/system-dashboard", label: "System Dashboard", icon: Settings },
  { to: "/admin/support", label: "Support Tickets", icon: MessageSquare },
] as const;
const VENDOR_NAV = [
  { to: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vendor/products", label: "My Products", icon: Package },
  { to: "/vendor/customers", label: "Customers", icon: Users },
  { to: "/vendor/customer-analytics", label: "Customer Analytics", icon: LineChart },
  { to: "/vendor/customer-segmentation", label: "Customer Segmentation", icon: PieChart },
  { to: "/vendor/orders", label: "Orders", icon: Receipt },
  { to: "/vendor/inventory", label: "Inventory", icon: Warehouse },
  { to: "/vendor/forecast", label: "Forecast", icon: Sparkles },
  { to: "/vendor/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/vendor/analytics", label: "Analytics", icon: LineChart },
  { to: "/vendor/reports", label: "Reports", icon: FileBarChart },
  { to: "/vendor/notifications", label: "Notifications", icon: Bell },
  { to: "/vendor/business-dashboard", label: "Business Dashboard", icon: TrendingUp },
  { to: "/vendor/business-insights", label: "Business Insights", icon: Lightbulb },
] as const;
const MANAGER_NAV = [
  { to: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/manager/reports", label: "Reports", icon: FileBarChart },
  { to: "/manager/notifications", label: "Notifications", icon: Bell },
  { to: "/manager/business-dashboard", label: "Business Dashboard", icon: TrendingUp },
  { to: "/manager/business-insights", label: "Business Insights", icon: Lightbulb },
] as const;
const STAFF_NAV = [
  { to: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/staff/reports", label: "Reports", icon: FileBarChart },
  { to: "/staff/notifications", label: "Notifications", icon: Bell },
  { to: "/staff/business-dashboard", label: "Business Dashboard", icon: TrendingUp },
  { to: "/staff/business-insights", label: "Business Insights", icon: Lightbulb },
] as const;
const CUSTOMER_NAV = [
  { to: "/customer/dashboard", label: "Marketplace", icon: ShoppingBag },
  { to: "/customer/wishlist", label: "Wishlist", icon: Heart },
  { to: "/customer/cart", label: "Cart", icon: ShoppingCart },
  { to: "/customer/orders", label: "Orders", icon: Receipt },
  { to: "/customer/notifications", label: "Notifications", icon: Bell },
  { to: "/customer/profile", label: "Profile", icon: User },
] as const;
export function AppSidebar({ role, onNavigate }: { role: "admin" | "vendor" | "manager" | "staff" | "customer"; onNavigate?: () => void }) {
  let nav;
  if (role === "admin") nav = ADMIN_NAV;
  else if (role === "vendor") nav = VENDOR_NAV;
  else if (role === "manager") nav = MANAGER_NAV;
  else if (role === "customer") nav = CUSTOMER_NAV;
  else nav = STAFF_NAV;
  const profileBase = role === "admin" ? "/admin" : role === "vendor" ? "/vendor" : role === "manager" ? "/manager" : role === "customer" ? "/customer" : "/staff";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logout } = useAuth();
  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold tracking-tight text-sidebar-foreground">ShopSense</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{role} console</div>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</div>
        <ul className="space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`sb-${role}`}
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary"
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</div>
        <ul className="space-y-0.5">
          <li>
            <Link to={`${profileBase}/profile`} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground", pathname.startsWith(`${profileBase}/profile`) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <User className="h-4 w-4" /> Profile
            </Link>
          </li>
          <li>
            <Link to={`${profileBase}/settings`} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground", pathname.startsWith(`${profileBase}/settings`) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </li>
          <li>
            <button onClick={() => { logout(); onNavigate?.(); window.location.assign("/login"); }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="m-3 rounded-xl border border-sidebar-border bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-3.5 w-3.5 text-primary" /> Pro insights</div>
        <p className="mt-1 text-xs text-muted-foreground">Unlock advanced forecasting and cohort analytics.</p>
      </div>
    </aside>
  );
}
