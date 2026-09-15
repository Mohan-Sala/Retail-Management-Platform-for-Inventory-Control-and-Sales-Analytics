import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface DrilldownDialogProps {
  field: string | null;
  value: string;
  onClose: () => void;
}

/**
 * @desc Analysis popup letting users explore deep years/months or category sub-levels
 */
export function DrilldownDialog({
  field,
  value,
  onClose,
}: DrilldownDialogProps) {
  const [level, setLevel] = useState("all");
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [dataList, setDataList] = useState<any[]>([]);
  const [nextLevel, setNextLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLevelData = async (targetVal: string, targetLvl: string) => {
    try {
      setLoading(true);
      const res: any = await api.get(
        `/business-intelligence/drilldown?field=${field}&value=${targetVal}&level=${targetLvl}`
      );
      const d = res.data || {};
      setDataList(d.data || []);
      setBreadcrumbs(d.breadcrumbs || []);
      setNextLevel(d.nextLevel || "");
      setLevel(d.currentLevel || targetLvl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (field) {
      fetchLevelData(value, "all");
    }
  }, [field]);

  if (!field) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-lg border border-border bg-card p-6 space-y-4 shadow-xl text-left text-xs">
        <div className="flex justify-between items-center border-b border-border/40 pb-2">
          <h3 className="text-sm font-bold text-foreground capitalize">Drilldown Analysis: {field}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="h-3 w-3" />}
              <span className={idx === breadcrumbs.length - 1 ? "text-foreground font-semibold" : ""}>{b}</span>
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-12">Loading subcategories...</div>
          ) : dataList.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12">No records found.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-[10px] text-muted-foreground font-semibold">
                  <th className="py-2 text-left">Item Label</th>
                  <th className="py-2 text-right">Value/Count</th>
                </tr>
              </thead>
              <tbody>
                {dataList.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => nextLevel && fetchLevelData(item.id, nextLevel)}
                    className={`border-b border-border/30 ${
                      nextLevel ? "cursor-pointer hover:bg-muted/30" : ""
                    } text-foreground`}
                  >
                    <td className="py-2.5 font-medium">{item.label}</td>
                    <td className="py-2.5 text-right font-bold">
                      {typeof item.value === "number" && item.value > 1000
                        ? `₹${item.value.toLocaleString()}`
                        : item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
export default DrilldownDialog;
