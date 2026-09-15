import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Package, Tag, FolderOpen, DollarSign, Boxes, AlertTriangle, Loader2, Image, Building2, FileText } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useVendorScope } from "@/hooks/useVendorScope";
import api from "@/lib/api";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books", "Toys", "Grocery"];

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { vendorId } = useVendorScope();
  
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      sku: "",
      price: "",
      stock: "",
      reorderLevel: "10",
      image: "https://picsum.photos/seed/default/400/400",
      category: "Electronics",
      vendorId: "",
      status: "active",
      description: "",
    },
  });

  // Load vendors list if user is an Admin
  useEffect(() => {
    if (open && user?.role === "admin") {
      async function loadVendors() {
        try {
          setLoadingVendors(true);
          const res: any = await api.get("/vendors?limit=100");
          const activeVendors = res.data.vendors || [];
          setVendors(activeVendors);
          if (activeVendors.length > 0) {
            form.setValue("vendorId", activeVendors[0].id);
          }
        } catch (err) {
          toast.error("Failed to load vendors");
        } finally {
          setLoadingVendors(false);
        }
      }
      loadVendors();
    }
  }, [open, user?.role]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        sku: "",
        price: "",
        stock: "",
        reorderLevel: "10",
        image: "https://picsum.photos/seed/default/400/400",
        category: "Electronics",
        vendorId: user?.role === "vendor" ? vendorId : vendors[0]?.id || "",
        status: "active",
        description: "",
      });
    }
  }, [open, vendorId, user?.role, vendors]);

  const imageUrl = form.watch("image");

  const onSubmit = async (data: any) => {
    try {
      const activeVendorId = user?.role === "vendor" ? vendorId : data.vendorId;
      if (!activeVendorId) {
        toast.error("Please select a vendor");
        return;
      }

      const priceVal = parseFloat(data.price);
      const stockVal = parseInt(data.stock);
      const reorderVal = parseInt(data.reorderLevel);

      if (!data.name.trim()) {
        toast.error("Product Name is required");
        return;
      }
      if (!data.sku.trim()) {
        toast.error("SKU is required");
        return;
      }
      if (isNaN(priceVal) || priceVal <= 0) {
        toast.error("Price must be a positive number greater than 0");
        return;
      }
      if (isNaN(stockVal) || stockVal < 0) {
        toast.error("Stock must be a positive integer");
        return;
      }
      if (isNaN(reorderVal) || reorderVal < 0) {
        toast.error("Reorder level must be a positive integer");
        return;
      }

      await api.post("/products", {
        ...data,
        price: priceVal,
        stock: stockVal,
        reorderLevel: reorderVal,
        vendorId: activeVendorId,
        status: data.status === "active" ? "active" : "draft",
      });

      toast.success("Product created successfully!");
      window.dispatchEvent(new Event("refetch-vendor-scope"));
      await router.invalidate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to create product:", err);
      toast.error(err.message || "Failed to create product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-0 gap-0 shadow-2xl border bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="h-5 w-5 text-primary" />
            Add New Product
          </DialogTitle>
          <DialogDescription>
            Publish a new SKU item catalog profile to the marketplace database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
            
            {/* Product Name */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-name">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Product Name *
              </Label>
              <Input id="dialog-prod-name" placeholder="e.g. Wireless Noise-Cancelling Headphones" {...form.register("name", { required: true })} />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-sku">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                SKU (Unique Code) *
              </Label>
              <Input id="dialog-prod-sku" placeholder="e.g. ELEC-HP-001" {...form.register("sku", { required: true })} />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Category *
              </Label>
              <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor (Admin only) */}
            {user?.role === "admin" && (
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Vendor Assignment *
                </Label>
                {loadingVendors ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground h-10 border rounded-md px-3 bg-secondary/10">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
                  </div>
                ) : vendors.length > 0 ? (
                  <Select value={form.watch("vendorId")} onValueChange={(v) => form.setValue("vendorId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-destructive p-2 border border-destructive/20 rounded bg-destructive/5">
                    No active vendors found. Please onboard a vendor first.
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-price">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Price (₹) *
              </Label>
              <Input id="dialog-prod-price" type="number" step="0.01" placeholder="999.00" {...form.register("price", { required: true })} />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-stock">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                Initial Stock *
              </Label>
              <Input id="dialog-prod-stock" type="number" placeholder="50" {...form.register("stock", { required: true })} />
            </div>

            {/* Reorder Level */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-reorder">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                Reorder Threshold *
              </Label>
              <Input id="dialog-prod-reorder" type="number" placeholder="10" {...form.register("reorderLevel", { required: true })} />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                Catalog Status
              </Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Listed)</SelectItem>
                  <SelectItem value="inactive">Inactive (Draft)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image URL */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-image">
                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                Image URL
              </Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input id="dialog-prod-image" placeholder="https://example.com/image.jpg" {...form.register("image")} />
                </div>
                {imageUrl && (
                  <div className="h-10 w-10 shrink-0 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                    <img 
                      src={imageUrl} 
                      className="h-full w-full object-cover" 
                      onError={(e) => { (e.target as any).src = "https://picsum.photos/seed/default/400/400" }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-prod-desc">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Description
              </Label>
              <Textarea id="dialog-prod-desc" rows={3} placeholder="Provide features, warranty, and package specs..." {...form.register("description")} />
            </div>

          </div>

          {/* Sticky/Fixed Footer Controls */}
          <DialogFooter className="pt-4 border-t gap-2 flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow cursor-pointer transition-all duration-150" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
