import { createFileRoute } from "@tanstack/react-router";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/staff/notifications")({
  component: StaffNotifications,
});

function StaffNotifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Notifications"
        description="Monitor system activities, task reminders, and operational logs."
      />
      <NotificationCenter role="staff" />
    </div>
  );
}
