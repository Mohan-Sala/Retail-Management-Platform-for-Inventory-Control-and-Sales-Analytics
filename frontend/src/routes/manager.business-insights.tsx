import { createFileRoute } from "@tanstack/react-router";
import { InsightsDashboard } from "@/components/insights/InsightsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/manager/business-insights")({
  component: ManagerBusinessInsights,
});

function ManagerBusinessInsights() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Insights Engine"
        description="Monitor division performance analytics, segment alerts, and forecast reports."
      />
      <InsightsDashboard role="manager" />
    </div>
  );
}
