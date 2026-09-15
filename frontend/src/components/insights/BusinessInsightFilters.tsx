import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BusinessInsightFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  onRegenerate: () => void;
}

/**
 * @desc Filters dropdown selector for category and priority levels
 */
export function BusinessInsightFilters({
  filters,
  setFilters,
  onRegenerate,
}: BusinessInsightFiltersProps) {
  const updateFilter = (key: string, val: string) => {
    setFilters({ ...filters, [key]: val || undefined });
  };

  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex flex-wrap gap-4 items-end rounded-xl shadow-sm text-left text-xs">
      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
        <select
          value={filters.category || ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="">All Categories</option>
          <option value="REVENUE">Revenue</option>
          <option value="INVENTORY">Inventory</option>
          <option value="CUSTOMER">Customer</option>
          <option value="FORECAST">Forecast</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Priority</label>
        <select
          value={filters.priority || ""}
          onChange={(e) => updateFilter("priority", e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <div className="flex gap-2 ml-auto">
        <Button size="sm" onClick={onRegenerate}>Regenerate Insights</Button>
      </div>
    </Card>
  );
}
export default BusinessInsightFilters;
