import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkStatus = async () => {
    try {
      const res: any = await api.get("/wishlist");
      const exists = (res.data?.items || []).some(
        (item: any) => item.productId?._id === productId || item.productId === productId
      );
      setSaved(exists);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);
      if (saved) {
        await api.delete(`/wishlist/${productId}`);
        setSaved(false);
        toast({ title: "Removed from Wishlist" });
      } else {
        await api.post("/wishlist", { productId });
        setSaved(true);
        toast({ title: "Saved to Wishlist" });
      }
    } catch (err: any) {
      toast({
        title: "Wishlist Error",
        description: err.response?.data?.message || "Failed to update wishlist.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      className={`h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-transform ${saved ? "bg-pink-500/10 text-pink-500 border-pink-500/30" : "bg-background text-muted-foreground"}`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-pink-500 text-pink-500" : ""}`} />
    </Button>
  );
}
