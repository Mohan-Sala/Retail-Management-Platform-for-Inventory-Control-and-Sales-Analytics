import { createFileRoute } from "@tanstack/react-router";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/manager/recommendations")({
  component: ManagerRecommendations,
});

function ManagerRecommendations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Recommendations Upgrade"
        description="Monitor organization recommendations accuracy, conversions, and segment metrics."
      />
      <RecommendationsDashboard role="manager" />
    </div>
  );
}
