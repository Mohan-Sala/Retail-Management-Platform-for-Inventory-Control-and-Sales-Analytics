import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Notifications"
        description="Monitor system health signals, inventory thresholds, and active alert rules."
      />
      <NotificationCenter role="admin" />
    </div>
  );
}
