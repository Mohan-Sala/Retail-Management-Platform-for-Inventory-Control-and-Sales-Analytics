import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { StoreSettings } from "@/components/settings/StoreSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SessionTable } from "@/components/settings/SessionTable";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("store");
  const [settings, setSettings] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/settings");
      setSettings(res.data);
    } catch (e) {
      toast.error("Failed to load settings variables");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res: any = await api.get("/users/sessions");
      setSessions(res.data || []);
    } catch (e) {
      toast.error("Failed to load active login sessions");
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSessions();
  }, []);

  const handleUpdateStore = async (data: any) => {
    try {
      const res: any = await api.put("/settings/store", data);
      toast.success("Store configurations settings saved");
      setSettings(res.data);
    } catch (e) {
      toast.error("Failed to update store settings");
    }
  };

  const handleUpdateSecurity = async (data: any) => {
    try {
      const res: any = await api.put("/settings/security", data);
      toast.success("Security policies saved successfully");
      setSettings(res.data);
    } catch (e) {
      toast.error("Failed to update security settings");
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await api.delete(`/users/sessions/${sessionId}`);
      toast.success("Active session terminated");
      fetchSessions();
    } catch (e) {
      toast.error("Failed to revoke session");
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      await api.delete("/users/sessions");
      toast.success("All other sessions terminated");
      fetchSessions();
    } catch (e) {
      toast.error("Failed to revoke other sessions");
    }
  };

  return (
    <div className="space-y-6 text-xs text-left">
      <PageHeader
        title="Store Configuration & Access settings"
        description="Configure details, tax settings, security timeouts, and manage active device sessions."
      />

      {loading || !settings ? (
        <div className="text-muted-foreground text-center py-6">Loading settings...</div>
      ) : (
        <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {activeTab === "store" && <StoreSettings settings={settings} onSubmit={handleUpdateStore} />}
          {activeTab === "security" && <SecuritySettings settings={settings} onSubmit={handleUpdateSecurity} />}
          {activeTab === "sessions" && (
            <SessionTable
              sessions={sessions}
              onTerminate={handleTerminateSession}
              onTerminateAll={handleTerminateAllSessions}
            />
          )}
        </SettingsLayout>
      )}
    </div>
  );
}
