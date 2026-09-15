import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, Moon, Search, Sun, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";

function toTitle(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppNavbar({ role }: { role: "admin" | "vendor" | "manager" | "staff" | "customer" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const pageTitle = segments.length ? toTitle(segments[segments.length - 1]) : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
          {segments.map((seg, i) => {
            const href = "/" + segments.slice(0, i + 1).join("/");
            const last = i === segments.length - 1;
            return (
              <span key={href} className="flex items-center gap-1">
                {i > 0 && <span className="opacity-50">/</span>}
                {last ? <span className="text-foreground">{toTitle(seg)}</span> : <Link to={href} className="hover:text-foreground">{toTitle(seg)}</Link>}
              </span>
            );
          })}
        </nav>
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{pageTitle}</h1>
      </div>

      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search vendors, products, orders…" className="w-64 pl-9 lg:w-80" />
      </div>

      <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <NotificationBell role={role} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full pl-1 pr-2 hover:bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium leading-tight">Welcome, {user?.name?.split(" ")[0]}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="text-sm">{user?.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to={`/${role}/profile`}>Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to={`/${role}/settings`}>Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { logout(); window.location.assign("/login"); }} className="text-destructive">Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
