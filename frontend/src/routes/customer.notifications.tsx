import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/customer/notifications")({
  head: () => ({ meta: [{ title: "Notifications · ShopSense" }] }),
  component: CustomerNotifications,
});

function CustomerNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View your order updates, personalized recommendations, and alerts."
      />
      <NotificationCenter role="customer" />
    </div>
  );
}
