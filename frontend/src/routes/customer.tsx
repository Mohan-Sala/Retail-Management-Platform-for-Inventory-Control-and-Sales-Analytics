import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";

export const Route = createFileRoute("/customer")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("shopsense.auth.user");
      if (!raw) throw redirect({ to: "/login" });
      const u = JSON.parse(raw);
      if (u.role !== "customer" && u.role !== "admin") throw redirect({ to: "/login" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: CustomerLayout,
});

function CustomerLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <div className="hidden lg:block"><AppSidebar role="customer" /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar role="customer" />
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
