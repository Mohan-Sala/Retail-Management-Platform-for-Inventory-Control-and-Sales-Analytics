import { createFileRoute } from "@tanstack/react-router";
import { InsightsDashboard } from "@/components/insights/InsightsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/staff/business-insights")({
  component: StaffBusinessInsights,
});

function StaffBusinessInsights() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Insights Engine"
        description="Monitor system-wide operational updates, catalog counts, and alerts."
      />
      <InsightsDashboard role="staff" />
    </div>
  );
}
