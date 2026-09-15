import { createFileRoute } from "@tanstack/react-router";
import { BusinessDashboard } from "@/components/bi/BusinessDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/manager/business-dashboard")({
  component: ManagerBusinessDashboard,
});

function ManagerBusinessDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor department progress, customer segmentation groups, and active stocks."
      />
      <BusinessDashboard role="manager" />
    </div>
  );
}
