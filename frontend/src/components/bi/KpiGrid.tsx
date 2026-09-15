import React from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, FileSpreadsheet, Activity, ShieldAlert, Award } from "lucide-react";

interface KpiGridProps {
  kpis: {
    revenue: number;
    transactions: number;
    aov: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  healthScore: {
    score: number;
    grade: string;
    statusColor: string;
    breakdown: Array<{ name: string; weight: string; score: number }>;
  };
}

/**
 * @desc Executive summary KPIs display card grid compiling Business Health Score ratios
 */
export function KpiGrid({ kpis, healthScore }: KpiGridProps) {
  const getStatusBg = (col: string) => {
    if (col === "emerald") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (col === "green") return "bg-green-500/10 text-green-500 border-green-500/20";
    if (col === "blue") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (col === "yellow") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="grid gap-4 md:grid-cols-4 text-left">
      {/* 1. Health Score */}
      <Card className={`p-4 border md:col-span-2 rounded-xl flex flex-col justify-between ${getStatusBg(healthScore.statusColor)}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider opacity-85">Business Health Index</h3>
            <div className="text-3xl font-extrabold mt-1">{healthScore.score}%</div>
          </div>
          <span className="text-3xl font-black uppercase">{healthScore.grade}</span>
        </div>
        <div className="space-y-2 mt-4">
          <div className="grid grid-cols-2 gap-2 text-[10px] opacity-90">
            {healthScore.breakdown.map((b) => (
              <div key={b.name} className="flex justify-between items-center bg-background/20 px-2 py-1 rounded">
                <span>{b.name}</span>
                <span className="font-bold">{b.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. Revenue */}
      <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">₹{kpis.revenue.toLocaleString()}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Revenue</div>
        </div>
      </Card>

      {/* 3. AOV */}
      <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">₹{Math.round(kpis.aov).toLocaleString()}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Average Order Value</div>
        </div>
      </Card>

      {/* 4. Stock warnings */}
      <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md rounded-xl flex items-center gap-3 md:col-span-2">
        <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-xl font-bold text-foreground">{kpis.lowStockCount}</div>
            <div className="text-[9px] uppercase font-bold text-muted-foreground">Low Stock Items</div>
          </div>
          <div>
            <div className="text-xl font-bold text-destructive">{kpis.outOfStockCount}</div>
            <div className="text-[9px] uppercase font-bold text-muted-foreground text-destructive">Out of Stock</div>
          </div>
        </div>
      </Card>

      {/* 5. Transactions */}
      <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md rounded-xl flex items-center gap-3 md:col-span-2">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{kpis.transactions}</div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Volume Transactions</div>
        </div>
      </Card>
    </div>
  );
}
export default KpiGrid;
