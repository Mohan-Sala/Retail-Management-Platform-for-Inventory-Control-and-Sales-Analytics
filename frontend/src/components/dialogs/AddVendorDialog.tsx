import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { Building2, User, Mail, Phone, ShieldCheck, MapPin, Percent, Image, Loader2, Info } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

const schema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerName: z.string().min(2, "Owner name must be at least 2 characters"),
  email: z.string().email("Must be a valid email address"),
  phone: z.string().min(6, "Phone number must be at least 6 characters"),
  gst: z.string().min(6, "GST number must be at least 6 characters"),
  address: z.string().min(2, "Address must be at least 2 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  commission: z.coerce.number().min(0, "Commission cannot be negative").max(100, "Commission cannot exceed 100%"),
  avatar: z.string().optional(),
  status: z.enum(["active", "pending", "suspended"]),
});

type V = z.infer<typeof schema>;

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVendorDialog({ open, onOpenChange }: AddVendorDialogProps) {
  const router = useRouter();
  
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      ownerName: "",
      email: "",
      phone: "",
      gst: "",
      address: "",
      city: "",
      commission: 10,
      avatar: "",
      status: "pending",
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        businessName: "",
        ownerName: "",
        email: "",
        phone: "",
        gst: "",
        address: "",
        city: "",
        commission: 10,
        avatar: "",
        status: "pending",
      });
    }
  }, [open]);

  const onSubmit = async (data: V) => {
    try {
      const res: any = await api.post("/vendors", data);
      
      if (res.data && res.data.credentials) {
        toast.success(`Vendor onboarded! Temp Password: ${res.data.credentials.password}`, {
          duration: 8000,
        });
      } else {
        toast.success("Vendor created successfully!");
      }

      await router.invalidate();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to onboarding vendor:", err);
      toast.error(err.message || "Failed to create vendor");
    }
  };

  const avatarUrl = form.watch("avatar");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-0 gap-0 shadow-2xl border bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-5 w-5 text-primary" />
            Add New Vendor
          </DialogTitle>
          <DialogDescription>
            Onboard a new merchant partner and provision a login User account automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
            
            {/* Business Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-biz">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Business Name *
              </Label>
              <Input id="dialog-vendor-biz" placeholder="e.g. Apex Retail India" {...form.register("businessName")} />
              {form.formState.errors.businessName && (
                <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>
              )}
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-owner">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Owner Name *
              </Label>
              <Input id="dialog-vendor-owner" placeholder="e.g. John Doe" {...form.register("ownerName")} />
              {form.formState.errors.ownerName && (
                <p className="text-xs text-destructive">{form.formState.errors.ownerName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-email">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address *
              </Label>
              <Input id="dialog-vendor-email" type="email" placeholder="vendor@shopsense.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-phone">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number *
              </Label>
              <Input id="dialog-vendor-phone" placeholder="e.g. 9876543210" {...form.register("phone")} />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            {/* GST */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-gst">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                GST Number *
              </Label>
              <Input id="dialog-vendor-gst" placeholder="e.g. 27AAAAA1111A1Z1" {...form.register("gst")} />
              {form.formState.errors.gst && (
                <p className="text-xs text-destructive">{form.formState.errors.gst.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-city">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                City *
              </Label>
              <Input id="dialog-vendor-city" placeholder="e.g. Mumbai" {...form.register("city")} />
              {form.formState.errors.city && (
                <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
              )}
            </div>

            {/* Commission */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-commission">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Commission Rate (%) *
              </Label>
              <Input id="dialog-vendor-commission" type="number" placeholder="10" {...form.register("commission")} />
              {form.formState.errors.commission && (
                <p className="text-xs text-destructive">{form.formState.errors.commission.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                Account Status
              </Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as V["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending Verification</SelectItem>
                  <SelectItem value="suspended">Suspended / Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-avatar">
                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                Avatar Logo URL
              </Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input id="dialog-vendor-avatar" placeholder="https://api.dicebear.com/7.x/shapes/svg?seed=retail" {...form.register("avatar")} />
                </div>
                {avatarUrl && (
                  <div className="h-10 w-10 shrink-0 rounded-full border bg-muted overflow-hidden flex items-center justify-center">
                    <img 
                      src={avatarUrl} 
                      className="h-full w-full object-cover" 
                      onError={(e) => { (e.target as any).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(form.watch("businessName") || "retail")}` }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1.5" htmlFor="dialog-vendor-addr">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Business Address *
              </Label>
              <Textarea id="dialog-vendor-addr" rows={3} placeholder="Full warehouse or office address..." {...form.register("address")} />
              {form.formState.errors.address && (
                <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>

          </div>

          <DialogFooter className="pt-4 border-t gap-2 flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow cursor-pointer transition-all duration-150" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...
                </>
              ) : (
                "Create Vendor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
