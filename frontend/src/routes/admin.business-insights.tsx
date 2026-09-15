import { createFileRoute } from "@tanstack/react-router";
import { InsightsDashboard } from "@/components/insights/InsightsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/admin/business-insights")({
  component: AdminBusinessInsights,
});

function AdminBusinessInsights() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Insights Engine"
        description="Monitor system-wide automated template insights, impact metrics, and priority warnings."
      />
      <InsightsDashboard role="admin" />
    </div>
  );
}
