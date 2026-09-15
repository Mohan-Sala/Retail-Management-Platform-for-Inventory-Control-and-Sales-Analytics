import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardFiltersProps {
  filters: any;
  setFilters: (f: any) => void;
  onRefresh: () => void;
  onExport: (format: string) => void;
}

/**
 * @desc Filters widget updates, synchronizing parameters automatically with URL queries
 */
export function DashboardFilters({
  filters,
  setFilters,
  onRefresh,
  onExport,
}: DashboardFiltersProps) {
  const updateFilter = (key: string, val: string) => {
    const updated = { ...filters, [key]: val || undefined };
    setFilters(updated);

    const url = new URL(window.location.href);
    if (val) {
      url.searchParams.set(key, val);
    } else {
      url.searchParams.delete(key);
    }
    window.history.pushState({}, "", url.toString());
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
          <option value="electronics">Electronics</option>
          <option value="apparel">Apparel</option>
          <option value="home">Home & Kitchen</option>
          <option value="sports">Sports & Fitness</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">City</label>
        <select
          value={filters.city || ""}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="">All Cities</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
          <option value="Bangalore">Bangalore</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <label className="text-[10px] font-bold text-muted-foreground uppercase">Customer Segment</label>
        <select
          value={filters.customerSegment || ""}
          onChange={(e) => updateFilter("customerSegment", e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="">All Segments</option>
          <option value="VIP">VIP Tier</option>
          <option value="Regular">Regular Tier</option>
          <option value="Inactive">Inactive Tier</option>
        </select>
      </div>

      <div className="flex gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={() => onExport("xlsx")}>Export Excel</Button>
        <Button variant="outline" size="sm" onClick={() => onExport("pdf")}>Export PDF</Button>
        <Button size="sm" onClick={onRefresh}>Manual Refresh</Button>
      </div>
    </Card>
  );
}
export default DashboardFilters;
