import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/staff/dashboard")({ component: StaffDashboard });

function StaffDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Dashboard"
        description={`Welcome back, ${user?.name || "Staff"}.`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">Workspace Overview</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Welcome to the Staff dashboard console. Use the side navigation menu to access reports, notifications, business performance metrics, and insights.
          </p>
        </Card>
      </div>
    </div>
  );
}
