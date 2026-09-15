import { createFileRoute } from "@tanstack/react-router";
import { BusinessDashboard } from "@/components/bi/BusinessDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/staff/business-dashboard")({
  component: StaffBusinessDashboard,
});

function StaffBusinessDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor system activities, product catalog statuses, and stock levels."
      />
      <BusinessDashboard role="staff" />
    </div>
  );
}
