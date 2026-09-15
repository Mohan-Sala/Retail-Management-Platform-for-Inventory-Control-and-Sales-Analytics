import { createFileRoute } from "@tanstack/react-router";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/staff/recommendations")({
  component: StaffRecommendations,
});

function StaffRecommendations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Recommendations Upgrade"
        description="Monitor trending product feeds, catalog parameters, and active listings."
      />
      <RecommendationsDashboard role="staff" />
    </div>
  );
}
