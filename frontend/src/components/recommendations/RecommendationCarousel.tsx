import React from "react";
import { RecommendationCard } from "./RecommendationCard";

interface RecommendationCarouselProps {
  products: any[];
  onFeedback: (prodId: string, action: string) => void;
}

/**
 * @desc Displays lists of RecommendationCards in responsive columns
 */
export function RecommendationCarousel({
  products,
  onFeedback,
}: RecommendationCarouselProps) {
  if (products.length === 0) {
    return (
      <div className="text-center text-xs text-muted-foreground py-12 bg-muted/20 border border-dashed rounded-xl">
        No active products matching the filters found.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {products.map((p) => (
        <RecommendationCard
          key={p.productId}
          product={p}
          onFeedback={(action) => onFeedback(p.productId, action)}
        />
      ))}
    </div>
  );
}
export default RecommendationCarousel;
