import { createFileRoute } from "@tanstack/react-router";
import { InsightsDashboard } from "@/components/insights/InsightsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/vendor/business-insights")({
  component: VendorBusinessInsights,
});

function VendorBusinessInsights() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Insights Engine"
        description="Monitor automated insights and operational warnings scoped to your store metrics."
      />
      <InsightsDashboard role="vendor" />
    </div>
  );
}
