import { createFileRoute } from "@tanstack/react-router";
import { ReportsManagement } from "@/components/reports/ReportsManagement";
import { PageHeader } from "@/components/common/PageHeader";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Reports"
        description="Compile and manage comprehensive, dynamic reports compiled from system metrics."
      />
      <ReportsManagement role="admin" />
    </div>
  );
}
