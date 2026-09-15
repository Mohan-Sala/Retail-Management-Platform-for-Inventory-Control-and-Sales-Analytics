import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DashboardFilters } from "./DashboardFilters";
import { KpiGrid } from "./KpiGrid";
import { DrilldownDialog } from "./DrilldownDialog";
import api from "@/lib/api";
import { toast } from "sonner";

interface BusinessDashboardProps {
  role: "admin" | "vendor" | "manager" | "staff";
}

/**
 * @desc Main Business Intelligence dashboard controller mapping filters, heatmaps, and drilldown overlays
 */
export function BusinessDashboard({ role }: BusinessDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [drillField, setDrillField] = useState<string | null>(null);
  const [drillVal, setDrillVal] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (filters.category) queryParams.push(`category=${filters.category}`);
      if (filters.city) queryParams.push(`city=${filters.city}`);
      if (filters.customerSegment) queryParams.push(`customerSegment=${filters.customerSegment}`);

      const url = `/business-intelligence?${queryParams.join("&")}`;
      const res: any = await api.get(url);
      setData(res.data);
    } catch (e) {
      toast.error("Failed to load business intelligence dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filters]);

  const handleExport = async (format: string) => {
    try {
      const res: any = await api.get(`/business-intelligence/export?format=${format}`);
      if (res.data?.jobId) {
        toast.success(`Export job queued (ID: ${res.data.jobId})`);
      }
    } catch (e) {
      toast.error("Export triggers failed");
    }
  };

  if (loading && !data) {
    return <div className="text-center text-xs text-muted-foreground py-12">Loading Business Intelligence Dashboard...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <DashboardFilters
        filters={filters}
        setFilters={setFilters}
        onRefresh={fetchDashboard}
        onExport={handleExport}
      />

      {data && (
        <div className="space-y-6">
          <KpiGrid kpis={data.kpis} healthScore={data.healthScore} />

          <div className="grid gap-4 md:grid-cols-3">
            <Card 
              className="p-4 border border-border/40 bg-card/60 cursor-pointer hover:bg-muted/10 transition-colors" 
              onClick={() => { setDrillField("revenue"); setDrillVal("2026"); }}
            >
              <h4 className="text-xs font-bold text-foreground">Revenue Drill-down</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Explore years, quarters, months, and days.</p>
            </Card>

            <Card 
              className="p-4 border border-border/40 bg-card/60 cursor-pointer hover:bg-muted/10 transition-colors" 
              onClick={() => { setDrillField("products"); setDrillVal("electronics"); }}
            >
              <h4 className="text-xs font-bold text-foreground">Products Drill-down</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Explore categories, brands, and products.</p>
            </Card>

            <Card 
              className="p-4 border border-border/40 bg-card/60 cursor-pointer hover:bg-muted/10 transition-colors" 
              onClick={() => { setDrillField("vendors"); setDrillVal("all"); }}
            >
              <h4 className="text-xs font-bold text-foreground">Vendor Drill-down</h4>
              <p className="text-[10px] text-muted-foreground mt-1">Explore vendor categories and items.</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5 border border-border/40 bg-card/30">
              <h4 className="text-xs font-bold text-foreground border-b border-border/40 pb-2 mb-3">AI Executive Insights</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {data.insights.map((ins: string, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0 animate-pulse" />
                    <span className="text-foreground/80">{ins}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border border-border/40 bg-card/30">
              <h4 className="text-xs font-bold text-foreground border-b border-border/40 pb-2 mb-3">Peak Sales Hourly Grid</h4>
              <div className="grid grid-cols-6 gap-2">
                {data.heatmaps.peakHours.map((h: any) => (
                  <div key={h.hour} className="bg-primary/10 border border-primary/20 rounded p-2 text-center transition-transform hover:scale-105">
                    <div className="text-[9px] text-muted-foreground">{h.hour}:00</div>
                    <div className="text-xs font-bold text-foreground">{h.sales}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <DrilldownDialog
        field={drillField}
        value={drillVal}
        onClose={() => setDrillField(null)}
      />
    </div>
  );
}
export default BusinessDashboard;
