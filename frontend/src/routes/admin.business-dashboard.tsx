import { createFileRoute } from "@tanstack/react-router";
import { BusinessDashboard } from "@/components/bi/BusinessDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/admin/business-dashboard")({
  component: AdminBusinessDashboard,
});

function AdminBusinessDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor system-wide metrics, profit margins, and peak analytics grids."
      />
      <BusinessDashboard role="admin" />
    </div>
  );
}
