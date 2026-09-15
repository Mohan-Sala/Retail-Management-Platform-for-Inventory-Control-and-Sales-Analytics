import React from "react";
import { Badge } from "@/components/ui/badge";

interface InsightPriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * @desc Badge displaying status colors matching low, high, and critical levels
 */
export function InsightPriorityBadge({ priority }: InsightPriorityBadgeProps) {
  const getColors = () => {
    if (priority === "CRITICAL") return "bg-red-500/10 text-red-500 border-red-500/20";
    if (priority === "HIGH") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    if (priority === "MEDIUM") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  };

  return (
    <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getColors()}`}>
      {priority}
    </Badge>
  );
}
export default InsightPriorityBadge;
