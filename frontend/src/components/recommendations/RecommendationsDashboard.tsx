import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { RecommendationAnalytics } from "./RecommendationAnalytics";
import { TrendingProducts } from "./TrendingProducts";
import { RecommendationCarousel } from "./RecommendationCarousel";
import api from "@/lib/api";
import { toast } from "sonner";
import { Star, ChevronDown } from "lucide-react";

interface RecommendationsDashboardProps {
  role: "admin" | "vendor" | "manager" | "staff";
}

/**
 * @desc Coordinates customer list queries, feedback enqueues, and trending product summaries
 */
export function RecommendationsDashboard({ role }: RecommendationsDashboardProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res: any = await api.get("/customers?limit=100");
        setCustomers(res.data || []);
      } catch (err) {
        console.error("Failed to load customer directory:", err);
      }
    }
    loadCustomers();
  }, []);

  const fetchRecommendations = async () => {
    if (!customerId) {
      toast.error("Please select a Customer first");
      return;
    }
    try {
      setLoading(true);
      const res: any = await api.get(`/recommendations/${customerId}`);
      setRecommendations(res.data?.recommendedProducts || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load customer recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (productId: string, action: string) => {
    try {
      await api.post("/recommendations/feedback", {
        customerId,
        productId,
        recommendationId: "rec_dashboard_engine",
        action,
      });
      toast.success("Feedback submitted and engine models adapted");
      fetchRecommendations();
    } catch (e) {
      toast.error("Failed to submit feedback");
    }
  };

  return (
    <div className="space-y-6 text-left text-xs">
      <RecommendationAnalytics />

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <Card className="p-5 border border-border/40 bg-card/60 backdrop-blur-md md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Star className="h-4 w-4 text-primary fill-primary animate-pulse" /> Personalized Engine Builder
          </h3>
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <div className="flex-1 w-full relative">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 pr-8 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-semibold"
              >
                <option value="">-- Select a Customer by Name --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            <button
              onClick={fetchRecommendations}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shrink-0 w-full md:w-auto"
            >
              Generate Recommendations
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border/30">
            {loading ? (
              <div className="text-center text-muted-foreground py-12">Compiling scoring matrices...</div>
            ) : (
              <RecommendationCarousel products={recommendations} onFeedback={handleFeedback} />
            )}
          </div>
        </Card>

        <TrendingProducts />
      </div>
    </div>
  );
}
export default RecommendationsDashboard;
