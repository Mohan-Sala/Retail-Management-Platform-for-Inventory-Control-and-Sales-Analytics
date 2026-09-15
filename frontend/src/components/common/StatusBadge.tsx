import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  paid: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  draft: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/30",
  refunded: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  out_of_stock: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", MAP[status] ?? "")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
