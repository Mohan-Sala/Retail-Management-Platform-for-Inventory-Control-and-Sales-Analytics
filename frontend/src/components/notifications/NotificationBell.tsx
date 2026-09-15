import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface NotificationBellProps {
  role: "admin" | "vendor" | "manager" | "staff";
}

/**
 * @desc Navbar notification indicator with real-time SSE stream listeners
 */
export function NotificationBell({ role }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const initFetch = async () => {
      try {
        const countRes: any = await api.get("/notifications/unread-count");
        setUnreadCount(countRes.data?.count || 0);

        const listRes: any = await api.get("/notifications?limit=5");
        setRecent(listRes.data?.notifications || []);
      } catch (e) {
        console.error("Failed to load initial notifications");
      }
    };
    initFetch();

    // SSE EventSource Stream connection
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("shopsense.auth.token");
    let eventSource = new EventSource(`${baseUrl}/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "connected") return;

        setUnreadCount(prev => prev + 1);
        setRecent(prev => [data, ...prev.slice(0, 4)]);
        toast.info(`Alert: ${data.title}`);
      } catch (err) {
        console.error("SSE stream parse exception:", err);
      }
    };

    eventSource.onerror = () => {
      console.warn("SSE stream disconnected. Reconnection will occur shortly.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setRecent(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All alerts marked read");
    } catch (e) {
      toast.error("Failed to update alerts state");
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setRecent(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-muted/60 text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <Card className="absolute right-0 mt-2 w-80 z-50 border border-border/40 bg-card p-4 shadow-xl space-y-3 rounded-xl animate-in slide-in-from-top-2 duration-150">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <h4 className="text-xs font-bold text-foreground">Recent Alerts</h4>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] text-primary font-semibold hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {recent.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-6">No new notifications.</div>
              ) : (
                recent.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleMarkSingleRead(n._id)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors text-left text-xs ${
                      n.isRead ? "bg-muted/10 text-foreground/80" : "bg-primary/5 border border-primary/10 text-foreground"
                    } hover:bg-muted/30`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold truncate">{n.title}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        n.priority === "critical" ? "bg-red-500/10 text-red-500" :
                        n.priority === "high" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                      }`}>
                        {n.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[8px] text-muted-foreground block mt-1">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border/40 pt-2 text-center">
              <a
                href={`/${role}/notifications`}
                onClick={() => setIsOpen(false)}
                className="text-[10px] text-primary font-semibold hover:underline"
              >
                Open Notification Center
              </a>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
export default NotificationBell;
