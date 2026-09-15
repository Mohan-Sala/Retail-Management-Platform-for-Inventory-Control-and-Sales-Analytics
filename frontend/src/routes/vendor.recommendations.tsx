import { createFileRoute } from "@tanstack/react-router";
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/vendor/recommendations")({
  component: VendorRecommendations,
});

function VendorRecommendations() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Recommendations Upgrade"
        description="Monitor product similarity matches for your store purchases history."
      />
      <RecommendationsDashboard role="vendor" />
    </div>
  );
}
