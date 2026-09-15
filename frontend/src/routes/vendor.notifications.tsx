import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/vendor/notifications")({
  component: VendorNotifications,
});

function VendorNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Notifications"
        description="Monitor your vendor store stock alerts, order achievements, and active alert rules."
      />
      <NotificationCenter role="vendor" />
    </div>
  );
}
