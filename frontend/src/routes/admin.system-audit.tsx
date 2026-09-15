import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { AuditLogTable } from "@/components/system/AuditLogTable";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/system-audit")({
  component: AdminSystemAudit,
});

function AdminSystemAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (filters.module) queryParams.push(`module=${filters.module}`);

      const res: any = await api.get(`/system/audit?${queryParams.join("&")}`);
      setLogs(res.data?.logs || []);
    } catch (e) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return (
    <div className="space-y-6 text-xs text-left">
      <PageHeader
        title="Immutable System Audit Trail"
        description="Verify all actions, API methods, and responses logs stored in the immutable security ledger."
      />
      <div className="flex gap-4 items-end bg-card p-4 rounded-xl border border-border/40 max-w-sm">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter by Module</label>
          <select
            value={filters.module || ""}
            onChange={(e) => setFilters({ ...filters, module: e.target.value || undefined })}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="products">Products Catalog</option>
            <option value="transactions">Transactions Ledger</option>
            <option value="system">Administration Settings</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading audit trail logs...</div>
      ) : (
        <AuditLogTable logs={logs} />
      )}
    </div>
  );
}
