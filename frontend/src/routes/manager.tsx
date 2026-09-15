import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";

export const Route = createFileRoute("/manager")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("shopsense.auth.user");
      if (!raw) throw redirect({ to: "/login" });
      const u = JSON.parse(raw);
      if (u.role !== "manager" && u.role !== "admin") throw redirect({ to: "/login" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in (e as object)) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: ManagerLayout,
});

function ManagerLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block"><AppSidebar role="manager" /></div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar role="manager" />
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
