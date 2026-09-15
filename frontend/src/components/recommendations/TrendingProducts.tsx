import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame } from "lucide-react";
import api from "@/lib/api";

/**
 * @desc Retrieves hourly evaluated trending products displaying scores
 */
export function TrendingProducts() {
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res: any = await api.get("/recommendations/trending");
        setList(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrending();
  }, []);

  return (
    <Card className="p-5 border border-border/40 bg-card/30 text-left text-xs space-y-3">
      <h4 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
        <Flame className="h-4 w-4 text-amber-500 fill-amber-500" /> Top Trending Products
      </h4>
      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">No trending items recalculated yet.</div>
        ) : (
          list.slice(0, 5).map((item) => (
            <div key={item._id} className="flex justify-between items-center bg-background/30 p-2 rounded border border-border/20">
              <div>
                <span className="font-medium text-foreground">{item.productId?.name || "Product Item"}</span>
                <div className="text-[10px] text-muted-foreground uppercase">{item.productId?.category}</div>
              </div>
              <span className="font-bold text-amber-500">{item.trendScore} Score</span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
export default TrendingProducts;
