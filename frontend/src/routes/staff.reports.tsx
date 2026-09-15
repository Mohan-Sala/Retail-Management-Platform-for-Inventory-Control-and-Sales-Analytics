import { createFileRoute } from "@tanstack/react-router";
import { ReportsManagement } from "@/components/reports/ReportsManagement";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/staff/reports")({
  component: StaffReports,
});

function StaffReports() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Reports"
        description="Compile and manage comprehensive, dynamic reports compiled from operational logs."
      />
      <ReportsManagement role="staff" />
    </div>
  );
}
