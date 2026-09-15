import { createFileRoute } from "@tanstack/react-router";
import { BusinessDashboard } from "@/components/bi/BusinessDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/vendor/business-dashboard")({
  component: VendorBusinessDashboard,
});

function VendorBusinessDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence Dashboard"
        description="Monitor your vendor store metrics, revenue lines, and stock levels."
      />
      <BusinessDashboard role="vendor" />
    </div>
  );
}
