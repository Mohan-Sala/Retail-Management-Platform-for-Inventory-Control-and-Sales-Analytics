import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { User, Phone, Mail, MapPin, Building, Loader2, RefreshCw } from "lucide-react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Must be a valid email address"),
  city: z.string().min(1, "City is required"),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  customer?: any; // populate if in edit mode
}

export function CustomerDialog({ open, onOpenChange, mode, customer }: CustomerDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      address: "",
    },
  });

  // Reset/populate form when modal open/customer data updates
  useEffect(() => {
    if (open) {
      if (mode === "edit" && customer) {
        reset({
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          city: customer.city || "",
          address: customer.address || "",
        });
      } else {
        reset({
          name: "",
          phone: "",
          email: "",
          city: "",
          address: "",
        });
      }
      
      // Auto focus first input field
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    }
  }, [open, mode, customer, reset]);

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setLoading(true);
      if (mode === "create") {
        await api.post("/customers", values);
        toast.success("Customer profile created successfully!");
      } else {
        await api.put(`/customers/${customer.id || customer._id}`, values);
        toast.success("Customer profile updated successfully!");
      }
      await router.invalidate();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAttempt = (force: boolean = false) => {
    if (!force && isDirty) {
      if (confirm("You have unsaved changes. Discard them?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all fields?")) {
      reset({
        name: "",
        phone: "",
        email: "",
        city: "",
        address: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Direct clicks on the backdrop/close
      if (!val) {
        handleCloseAttempt();
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent 
        className="max-w-lg"
        onEscapeKeyDown={(e) => {
          if (isDirty) {
            e.preventDefault();
            handleCloseAttempt();
          }
        }}
        onPointerDownOutside={(e) => {
          if (isDirty) {
            e.preventDefault();
            handleCloseAttempt();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {mode === "create" ? "Add Customer Record" : "Edit Customer Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Register a new customer profile. All customer records are managed under strict audit logging." 
              : "Update customer profile information. All updates will be synchronized across transaction analytics."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-xs font-semibold">Full Name *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  className="pl-9"
                  disabled={loading}
                  {...register("name")}
                  ref={(e) => {
                    register("name").ref(e);
                    // @ts-ignore
                    firstInputRef.current = e;
                  }}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold">Phone Number *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="e.g. +91 9876543210"
                    className="pl-9"
                    disabled={loading}
                    {...register("phone")}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold">Email Address *</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. john@example.com"
                    className="pl-9"
                    disabled={loading}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="city" className="text-xs font-semibold">City *</Label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  placeholder="e.g. Mumbai"
                  className="pl-9"
                  disabled={loading}
                  {...register("city")}
                />
              </div>
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div>
              <Label htmlFor="address" className="text-xs font-semibold">Street Address</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="e.g. Flat 402, Park Heights"
                  className="pl-9"
                  disabled={loading}
                  {...register("address")}
                />
              </div>
              {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>}
            </div>
          </div>

          <DialogFooter className="flex items-center gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={loading}
              className="mr-auto"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleCloseAttempt(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
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
