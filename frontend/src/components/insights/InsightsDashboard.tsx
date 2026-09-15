import React, { useEffect, useState } from "react";
import { BusinessInsightFilters } from "./BusinessInsightFilters";
import { BusinessInsightAnalytics } from "./BusinessInsightAnalytics";
import { BusinessInsightList } from "./BusinessInsightList";
import api from "@/lib/api";
import { toast } from "sonner";

interface InsightsDashboardProps {
  role: "admin" | "vendor" | "manager" | "staff";
}

/**
 * @desc Coordinates insights filters updates, actions requests, and regeneration sweeps
 */
export function InsightsDashboard({ role }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (filters.category) queryParams.push(`category=${filters.category}`);
      if (filters.priority) queryParams.push(`priority=${filters.priority}`);

      const res: any = await api.get(`/business-insights?${queryParams.join("&")}`);
      setInsights(res.data?.insights || []);
    } catch (e) {
      toast.error("Failed to load business insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [filters]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.put(`/business-insights/${id}/${action}`);
      toast.success(`Insight successfully marked as ${action}`);
      fetchInsights();
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      await api.post("/business-insights/regenerate");
      toast.success("Insights regenerated successfully");
      fetchInsights();
    } catch (e) {
      toast.error("Regeneration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      <BusinessInsightAnalytics />
      <BusinessInsightFilters filters={filters} setFilters={setFilters} onRegenerate={handleRegenerate} />
      {loading ? (
        <div className="text-center text-muted-foreground py-12">Compiling insights...</div>
      ) : (
        <BusinessInsightList insights={insights} onAction={handleAction} />
      )}
    </div>
  );
}
export default InsightsDashboard;
