import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SystemHealthCard } from "@/components/system/SystemHealthCard";
import { BackgroundJobsTable } from "@/components/system/BackgroundJobsTable";
import { ApiUsageTable } from "@/components/system/ApiUsageTable";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/system-dashboard")({
  component: AdminSystemDashboard,
});

function AdminSystemDashboard() {
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [dashRes, jobsRes, apiRes]: any = await Promise.all([
        api.get("/system/dashboard"),
        api.get("/system/background-jobs"),
        api.get("/system/api-usage"),
      ]);
      setData(dashRes.data);
      setJobs(jobsRes.data || []);
      setMetrics(apiRes.data || []);
    } catch (e) {
      toast.error("Failed to load administration status metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleJob = async (name: string, action: string) => {
    try {
      await api.put(`/system/background-jobs/${name}/${action}`);
      toast.success(`Job successfully updated to ${action}`);
      fetchStats();
    } catch (e) {
      toast.error("Failed to update background job state");
    }
  };

  const handleManualCleanup = async () => {
    try {
      setLoading(true);
      await api.post("/system/cleanup");
      toast.success("Retention cleanups sweep executed successfully");
      fetchStats();
    } catch (e) {
      toast.error("Cleanup sweep failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-left">
      <div className="flex justify-between items-start">
        <PageHeader
          title="System Administration Dashboard"
          description="Monitor server loads, heap allocations, database pings, API usage metrics, and job states."
        />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Stats
          </Button>
          <Button size="sm" onClick={handleManualCleanup} disabled={loading}>
            <ShieldAlert className="h-4 w-4 mr-1.5" /> Execute Cleanup Sweep
          </Button>
        </div>
      </div>

      {data && <SystemHealthCard server={data.server} database={data.database} />}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Background Workers Status</h3>
          <BackgroundJobsTable jobs={jobs} onToggle={handleToggleJob} />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">API Latency Usage Metrics</h3>
          <ApiUsageTable metrics={metrics} />
        </div>
      </div>
    </div>
  );
}
