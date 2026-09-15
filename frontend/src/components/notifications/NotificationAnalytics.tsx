import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info, BellRing } from "lucide-react";
import api from "@/lib/api";

/**
 * @desc Displays detailed notification read ratios, average response time, categories and priorities distribution
 */
export function NotificationAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res: any = await api.get("/notifications/analytics");
        setData(res.data);
      } catch (e) {
        console.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center text-xs text-muted-foreground py-12">Loading statistics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid gap-4 md:grid-cols-4 text-left">
        <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{data.totalNotifications || 0}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Dispatched</div>
          </div>
        </Card>

        <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{data.readRate || 0}%</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Read Rate</div>
          </div>
        </Card>

        <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{data.unread || 0}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Pending Unread</div>
          </div>
        </Card>

        <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">
              {Math.round((data.averageTimeToReadMs || 0) / 1000 / 60)} mins
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Avg Read Time</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 text-left">
        <Card className="p-4 border border-border/40 bg-card/30">
          <h4 className="text-xs font-bold text-foreground mb-3 border-b border-border/40 pb-2">Category Distribution</h4>
          <div className="space-y-2">
            {(data.byCategory || []).map((c: any) => (
              <div key={c.category} className="flex justify-between items-center text-xs">
                <span className="capitalize text-muted-foreground">{c.category}</span>
                <span className="font-semibold text-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border border-border/40 bg-card/30">
          <h4 className="text-xs font-bold text-foreground mb-3 border-b border-border/40 pb-2">Priority Distribution</h4>
          <div className="space-y-2">
            {(data.byPriority || []).map((p: any) => (
              <div key={p.priority} className="flex justify-between items-center text-xs">
                <span className="capitalize text-muted-foreground">{p.priority}</span>
                <span className="font-semibold text-foreground">{p.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
export default NotificationAnalytics;
