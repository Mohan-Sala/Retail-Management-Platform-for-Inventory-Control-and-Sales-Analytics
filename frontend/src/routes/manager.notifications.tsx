import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/manager/notifications")({
  component: ManagerNotifications,
});

function ManagerNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Notifications"
        description="Monitor department alerts, inventory levels, and system health status."
      />
      <NotificationCenter role="manager" />
    </div>
  );
}
