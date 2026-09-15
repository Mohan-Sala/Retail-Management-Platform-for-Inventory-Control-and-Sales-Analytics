import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportFiltersProps {
  type: string;
  setType: (t: string) => void;
  format: string;
  setFormat: (f: string) => void;
  onGenerate: () => void;
}

/**
 * @desc Report Filter panel selecting categories and file outputs
 */
export function ReportFilters({
  type,
  setType,
  format,
  setFormat,
  onGenerate,
}: ReportFiltersProps) {
  return (
    <Card className="p-4 bg-card/60 backdrop-blur-md border border-border/40 flex flex-wrap gap-4 items-end rounded-xl shadow-sm">
      <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-muted-foreground">Report Category</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="product">Catalog Products Summary</option>
          <option value="vendor">Registered Vendors Performance</option>
          <option value="customer">Shoppers Segment Contributions</option>
          <option value="transaction">Completed Transactions History</option>
          <option value="sales">Sales & Revenue Reports</option>
          <option value="executive">Executive Summary Analytics</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <label className="text-xs font-semibold text-muted-foreground">File Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        >
          <option value="pdf">PDF Document</option>
          <option value="xlsx">Excel Spreadsheet</option>
          <option value="csv">CSV Spreadsheet</option>
        </select>
      </div>

      <Button onClick={onGenerate} className="px-6 h-10 shadow-sm hover:shadow-md transition-shadow">
        Compile Report
      </Button>
    </Card>
  );
}
