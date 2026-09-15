import { createFileRoute } from "@tanstack/react-router";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/admin/recommendations")({
  component: AdminRecommendations,
});

function AdminRecommendations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Recommendations Upgrade"
        description="Monitor system-wide multi-factor customer matches, FBT pairs, and trending score graphs."
      />
      <RecommendationsDashboard role="admin" />
    </div>
  );
}
