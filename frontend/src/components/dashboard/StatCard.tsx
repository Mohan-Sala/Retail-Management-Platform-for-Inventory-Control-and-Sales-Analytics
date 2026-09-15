import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, delta, icon: Icon, tone = "primary", index = 0,
}: {
  label: string; value: string; delta?: number; icon: LucideIcon;
  tone?: "primary" | "accent" | "warning" | "destructive"; index?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={cn("grid h-10 w-10 place-items-center rounded-lg", toneMap[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          {typeof delta === "number" && (
            <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium", positive ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <div className="mt-4 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </Card>
    </motion.div>
  );
}
