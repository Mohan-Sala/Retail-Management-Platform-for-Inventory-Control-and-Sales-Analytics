import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";

export const Route = createFileRoute("/vendor")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("shopsense.auth.user");
      if (!raw) throw redirect({ to: "/login" });
      const u = JSON.parse(raw);
      if (u.role !== "vendor") throw redirect({ to: "/admin/dashboard" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: VendorLayout,
});

function VendorLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block"><AppSidebar role="vendor" /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar role="vendor" />
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
