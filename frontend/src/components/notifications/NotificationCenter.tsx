import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationPreferences } from "./NotificationPreferences";
import { NotificationAnalytics } from "./NotificationAnalytics";
import api from "@/lib/api";
import { toast } from "sonner";
import { Trash2, Archive, CheckCircle, Bell, Settings, BarChart2 } from "lucide-react";

interface NotificationCenterProps {
  role: "admin" | "vendor" | "manager" | "staff" | "customer";
}

/**
 * @desc Core notification center layout managing filters, bulk read statuses, and preference subtabs
 */
export function NotificationCenter({ role }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<"list" | "prefs" | "stats">("list");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("all");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      let url = "/notifications?limit=50";
      if (category) url += `&category=${category}`;
      if (priority) url += `&priority=${priority}`;
      if (status === "archived") url += `&status=archived`;

      const res: any = await api.get(url);
      setNotifications(res.data?.notifications || []);
    } catch (e) {
      toast.error("Failed to load notifications history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") {
      loadNotifications();
    }
  }, [activeTab, category, priority, status]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      toast.error("Failed to update notification state");
    }
  };

  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      await api.put(`/notifications/${id}/archive`, { isArchived });
      toast.success(isArchived ? "Archived alert" : "Restored alert");
      loadNotifications();
    } catch (e) {
      toast.error("Failed to archive notification");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success("Notification deleted");
      loadNotifications();
    } catch (e) {
      toast.error("Failed to delete notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      toast.success("All notifications marked read");
      loadNotifications();
    } catch (e) {
      toast.error("Failed to update notifications state");
    }
  };

  const handleTriggerTest = async () => {
    try {
      await api.post("/notifications/test", {
        category: "system",
        priority: "medium",
      });
      toast.success("Test notification dispatched");
      setTimeout(loadNotifications, 1000);
    } catch (e) {
      toast.error("Failed to dispatch test alert");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-border/40 gap-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Alert Center
        </button>
        <button
          onClick={() => setActiveTab("prefs")}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "prefs" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" />
          Preferences
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`pb-2.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "stats" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {activeTab === "list" && (
        <div className="space-y-4">
          <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex flex-wrap gap-4 items-end rounded-xl shadow-sm">
            <div className="flex flex-col gap-1.5 min-w-[120px] text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Categories</option>
                <option value="inventory">Inventory</option>
                <option value="sales">Sales</option>
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="forecast">Forecast</option>
                <option value="reports">Reports</option>
                <option value="ai">AI Assistant</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px] text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 min-w-[120px] text-left">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Archive Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Active Alerts</option>
                <option value="archived">Archived Logs</option>
              </select>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleTriggerTest}>
                Trigger Test Alert
              </Button>
              <Button size="sm" onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-xs text-muted-foreground py-12">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-12">No notifications found.</div>
            ) : (
              notifications.map((n) => (
                <Card
                  key={n._id}
                  className={`p-4 border border-border/40 transition-colors text-left flex justify-between items-start gap-4 ${
                    n.isRead ? "bg-card/30 opacity-70" : "bg-card/75 border-l-4 border-l-primary"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-foreground truncate">{n.title}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        n.priority === "critical" ? "bg-red-500/10 text-red-500" :
                        n.priority === "high" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {n.priority}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-muted text-muted-foreground">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                    <span className="text-[9px] text-muted-foreground block font-medium">
                      Dispatched: {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {!n.isRead && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkRead(n._id)} title="Mark read" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleArchive(n._id, !n.isArchived)} title={n.isArchived ? "Restore to active" : "Archive alert"} className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(n._id)} title="Delete notification" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "prefs" && <NotificationPreferences />}

      {activeTab === "stats" && <NotificationAnalytics />}
    </div>
  );
}
export default NotificationCenter;
