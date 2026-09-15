import React from "react";
import { BusinessInsightCard } from "./BusinessInsightCard";

interface BusinessInsightListProps {
  insights: any[];
  onAction: (id: string, action: string) => void;
}

/**
 * @desc Lists all active insight items, capturing read/archive/dismiss action updates
 */
export function BusinessInsightList({
  insights,
  onAction,
}: BusinessInsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-12 bg-muted/20 border border-dashed rounded-xl">
        No active business insights resolved matching the filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {insights.map((ins) => (
        <BusinessInsightCard
          key={ins._id}
          insight={ins}
          onRead={() => onAction(ins._id, "read")}
          onArchive={() => onAction(ins._id, "archive")}
          onDismiss={() => onAction(ins._id, "dismiss")}
        />
      ))}
    </div>
  );
}
export default BusinessInsightList;
