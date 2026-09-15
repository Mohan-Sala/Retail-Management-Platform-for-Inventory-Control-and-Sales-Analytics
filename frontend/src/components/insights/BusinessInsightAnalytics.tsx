import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sparkles, Percent, Activity } from "lucide-react";
import api from "@/lib/api";

/**
 * @desc Displays totals, averages, and read ratio rates inside dashboard grids
 */
export function BusinessInsightAnalytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res: any = await api.get("/business-insights/analytics");
        setData(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAnalytics();
  }, []);

  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4 text-left text-xs">
      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.totalInsights}</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Insights</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Percent className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.averageImpactScore}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Avg Impact Score</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.averageConfidenceScore}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Avg Confidence Score</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.readRate}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Read Ratio Rate</div>
        </div>
      </Card>
    </div>
  );
}
export default BusinessInsightAnalytics;
