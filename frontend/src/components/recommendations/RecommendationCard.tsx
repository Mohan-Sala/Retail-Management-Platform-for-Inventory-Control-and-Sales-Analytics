import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ThumbsUp, ThumbsDown, EyeOff, Flame, Compass } from "lucide-react";

interface RecommendationCardProps {
  product: {
    productId: string;
    productName: string;
    sku: string;
    category: string;
    vendor: string;
    price: number;
    currentStock: number;
    recommendationScore: number;
    confidenceScore: number;
    recommendationReasons: string[];
    recommendationFactors: {
      categoryMatch: number;
      vendorMatch: number;
      popularity: number;
      feedback: number;
      forecast: number;
      seasonality: number;
    };
    productImage?: string;
  };
  onFeedback: (action: string) => void;
}

/**
 * @desc Modular card displaying normalized recommendation parameters and interactive feedback toggles
 */
export function RecommendationCard({ product, onFeedback }: RecommendationCardProps) {
  return (
    <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex flex-col justify-between rounded-xl shadow-sm text-left text-xs gap-3">
      <div className="flex gap-2 items-start justify-between">
        <div>
          <h4 className="font-bold text-foreground line-clamp-1">{product.productName}</h4>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{product.category}</span>
        </div>
        <div className="bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 font-bold text-[10px]">
          {product.recommendationScore}% Score
        </div>
      </div>

      <div className="h-24 bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground">
        <Sparkles className="h-6 w-6 opacity-40" />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Confidence Indicator:</span>
          <span className="font-semibold text-foreground">{product.confidenceScore}%</span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Supplier:</span>
          <span className="font-semibold text-foreground">{product.vendor}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {product.recommendationReasons.map((reason, idx) => (
          <span key={idx} className="bg-muted px-2 py-0.5 rounded text-[8px] font-medium text-muted-foreground">
            {reason}
          </span>
        ))}
        {product.recommendationFactors.popularity > 10 && (
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
            <Flame className="h-2 w-2" /> Trending
          </span>
        )}
        {product.recommendationFactors.forecast > 10 && (
          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5">
            <Compass className="h-2 w-2" /> High Forecast
          </span>
        )}
      </div>

      <div className="flex gap-1.5 mt-2 pt-2 border-t border-border/30">
        <Button variant="outline" size="sm" className="flex-1 py-1 h-7 text-[10px]" onClick={() => onFeedback("CLICKED")}>
          <ThumbsUp className="h-3 w-3 mr-1" /> Like
        </Button>
        <Button variant="outline" size="sm" className="flex-1 py-1 h-7 text-[10px]" onClick={() => onFeedback("NOT_INTERESTED")}>
          <ThumbsDown className="h-3 w-3 mr-1" /> Dislike
        </Button>
        <Button variant="outline" size="sm" className="py-1 h-7 px-2" onClick={() => onFeedback("DISMISSED")}>
          <EyeOff className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
export default RecommendationCard;
