import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sparkles, TrendingUp, Percent } from "lucide-react";
import api from "@/lib/api";

/**
 * @desc Displays Coverage, CTR, and Conversion rates inside dashboard layouts
 */
export function RecommendationAnalytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res: any = await api.get("/recommendations/analytics");
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
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.ctr}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Recommendation CTR</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Percent className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.conversionRate}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Conversion Rate</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.recommendationCoverage}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Product Coverage</div>
        </div>
      </Card>

      <Card className="p-4 border border-border bg-card/60 rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{data.recommendationAccuracy}%</div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Engine Accuracy</div>
        </div>
      </Card>
    </div>
  );
}
export default RecommendationAnalytics;
