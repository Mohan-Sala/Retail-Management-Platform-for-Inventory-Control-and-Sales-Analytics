import { Link } from "@tanstack/react-router";
import { ShoppingBag, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export function PublicNavbar() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">ShopSense</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#analytics" className="hover:text-foreground">Analytics</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
          {user ? (
            <Button asChild><Link to={user.role === "admin" ? "/admin/dashboard" : "/vendor/dashboard"}>Open dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
              <Button asChild><Link to="/register">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
