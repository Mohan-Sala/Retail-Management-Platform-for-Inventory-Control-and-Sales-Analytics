import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Warehouse, Tag, Boxes, AlertTriangle, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editItem?: any | null; // The inventory item to edit
}

export function InventoryDialog({ open, onOpenChange, mode, editItem }: InventoryDialogProps) {
  const router = useRouter();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const form = useForm({
    defaultValues: {
      productId: "",
      minimumStock: "10",
      maximumStock: "100",
    },
  });

  // Load products without existing inventory if in Create mode
  useEffect(() => {
    if (open && mode === "create") {
      async function loadEligibleProducts() {
        try {
          setLoadingProducts(true);
          const [prodRes, invRes] = await Promise.all([
            api.get("/products?limit=200"),
            api.get("/inventory?limit=200")
          ]);
          
          const allProds = prodRes.data.products || [];
          const allInvs = invRes.data.inventory || [];
          
          // Filter out products that already have an inventory record
          const eligible = allProds.filter(
            (p: any) => !allInvs.some((inv: any) => inv.productId === p.id)
          );
          
          setProducts(eligible);
          if (eligible.length > 0) {
            form.setValue("productId", eligible[0].id);
          } else {
            form.setValue("productId", "");
          }
        } catch (err) {
          toast.error("Failed to load products list");
        } finally {
          setLoadingProducts(false);
        }
      }
      loadEligibleProducts();
    }
  }, [open, mode]);

  // Set default values when editing
  useEffect(() => {
    if (open) {
      if (mode === "edit" && editItem) {
        form.reset({
          productId: editItem.productId || "",
          minimumStock: String(editItem.minimumStock),
          maximumStock: String(editItem.maximumStock),
        });
      } else {
        form.reset({
          productId: "",
          minimumStock: "10",
          maximumStock: "100",
        });
      }
    }
  }, [open, mode, editItem]);

  const onSubmit = async (data: any) => {
    try {
      const minVal = parseInt(data.minimumStock);
      const maxVal = parseInt(data.maximumStock);

      if (isNaN(minVal) || minVal < 0) {
        toast.error("Minimum stock must be a positive integer");
        return;
      }
      if (isNaN(maxVal) || maxVal <= minVal) {
        toast.error("Maximum stock must be strictly greater than minimum stock");
        return;
      }

      if (mode === "create") {
        if (!data.productId) {
          toast.error("Please select a product");
          return;
        }

        await api.post("/inventory", {
          productId: data.productId,
          minimumStock: minVal,
          maximumStock: maxVal,
        });

        toast.success("Inventory record created successfully!");
      } else {
        // Edit Mode
        const currentStock = editItem?.currentStock || 0;
        if (maxVal < currentStock) {
          toast.error(`Maximum stock cannot be less than current stock (${currentStock} units)`);
          return;
        }

        await api.put(`/inventory/${editItem.id}`, {
          minimumStock: minVal,
          maximumStock: maxVal,
        });

        toast.success("Inventory configuration updated successfully!");
      }

      await router.invalidate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save inventory:", err);
      toast.error(err.message || "Failed to save inventory settings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0 gap-0 shadow-2xl border bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Warehouse className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add Inventory Record" : "Configure Inventory Rules"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Initialize min/max tracking levels for a product SKU." 
              : "Adjust thresholds for automated stock alerts."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          {mode === "create" ? (
            /* Product Selection */
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Product *
              </Label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 border rounded-md px-3 bg-secondary/10 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching untracked products...
                </div>
              ) : products.length > 0 ? (
                <Select value={form.watch("productId")} onValueChange={(v) => form.setValue("productId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an untracked product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-md bg-secondary/5">
                  All products already have inventory records configured.
                </div>
              )}
            </div>
          ) : (
            /* Read-Only Product Info */
            <div className="space-y-3 p-3.5 rounded-lg border bg-secondary/10 text-sm">
              <div><strong>Product:</strong> {editItem?.productName}</div>
              <div><strong>SKU:</strong> {editItem?.sku}</div>
              <div><strong>Current Stock:</strong> {editItem?.currentStock} units</div>
            </div>
          )}

          {/* Min Stock */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5" htmlFor="dialog-inv-min">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
              Minimum Stock Level (Low Stock Alert Threshold) *
            </Label>
            <Input id="dialog-inv-min" type="number" placeholder="10" {...form.register("minimumStock", { required: true })} />
          </div>

          {/* Max Stock */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5" htmlFor="dialog-inv-max">
              <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
              Maximum Capacity Stock Level *
            </Label>
            <Input id="dialog-inv-max" type="number" placeholder="100" {...form.register("maximumStock", { required: true })} />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow cursor-pointer"
              disabled={form.formState.isSubmitting || (mode === "create" && products.length === 0)}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
