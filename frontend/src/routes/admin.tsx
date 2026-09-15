import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    // client-only: use localStorage to gate; SSR is disabled for these routes
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("shopsense.auth.token");
      const raw = localStorage.getItem("shopsense.auth.user");
      if (!raw || !token) throw redirect({ to: "/login" });
      const u = JSON.parse(raw);
      if (u.role !== "admin") throw redirect({ to: "/vendor/dashboard" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block"><AppSidebar role="admin" /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar role="admin" />
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
