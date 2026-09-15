import React from "react";
import { Card } from "@/components/ui/card";
import { InsightPriorityBadge } from "./InsightPriorityBadge";
import { Eye, Archive, Trash2, ArrowUpRight } from "lucide-react";

interface BusinessInsightCardProps {
  insight: {
    _id: string;
    title: string;
    description: string;
    category: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    type: "POSITIVE" | "NEGATIVE" | "WARNING" | "OPPORTUNITY" | "TREND";
    impactScore: number;
    confidenceScore: number;
    recommendation: string;
    isRead: boolean;
  };
  onRead: () => void;
  onArchive: () => void;
  onDismiss: () => void;
}

/**
 * @desc Card displaying template-driven details, impact metrics, and actions triggers
 */
export function BusinessInsightCard({
  insight,
  onRead,
  onArchive,
  onDismiss,
}: BusinessInsightCardProps) {
  const getTypeColor = (type: string) => {
    if (type === "POSITIVE") return "border-l-4 border-l-emerald-500 bg-emerald-500/5";
    if (type === "NEGATIVE" || type === "WARNING") return "border-l-4 border-l-red-500 bg-red-500/5";
    if (type === "OPPORTUNITY") return "border-l-4 border-l-blue-500 bg-blue-500/5";
    return "border-l-4 border-l-amber-500 bg-amber-500/5";
  };

  return (
    <Card className={`p-4 border border-border/40 text-left text-xs flex flex-col justify-between rounded-xl shadow-sm gap-3 ${getTypeColor(insight.type)}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{insight.category}</span>
          <h4 className="font-bold text-foreground mt-0.5">{insight.title || "Business Insight"}</h4>
        </div>
        <div className="flex gap-1 items-center">
          <InsightPriorityBadge priority={insight.priority} />
          {!insight.isRead && <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />}
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">{insight.description}</p>

      <div className="bg-background/40 p-2.5 rounded-lg border border-border/20 text-muted-foreground mt-1.5 flex gap-2">
        <ArrowUpRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider block">Recommended Action</span>
          <span className="text-xs text-foreground/80">{insight.recommendation}</span>
        </div>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border/30 pt-2.5 mt-1.5">
        <div className="flex gap-4">
          <span>Impact: <strong className="text-foreground">{insight.impactScore}%</strong></span>
          <span>Confidence: <strong className="text-foreground">{insight.confidenceScore}%</strong></span>
        </div>
        <div className="flex gap-2">
          <button onClick={onRead} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Mark Read">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={onArchive} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Archive">
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDismiss} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Dismiss">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}
export default BusinessInsightCard;
