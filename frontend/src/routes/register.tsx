import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  confirm: z.string().min(6),
  role: z.enum(["customer", "vendor", "admin"]),
  businessName: z.string().optional(),
  phone: z.string().min(6, "Enter a phone number"),
  terms: z.boolean().refine((v) => v, "Please accept the terms"),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" })
  .refine((d) => d.role !== "vendor" || (d.businessName && d.businessName.length > 1), { path: ["businessName"], message: "Business name is required" });

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account · ShopSense" }] }),
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "", role: "customer", businessName: "", phone: "", terms: false },
  });
  const role = form.watch("role");

  const onSubmit = async (v: FormValues) => {
    try {
      const u = await register({ name: v.name, email: v.email, password: v.password, role: v.role, businessName: v.businessName, phone: v.phone });
      toast.success(`Welcome to ShopSense, ${u.name.split(" ")[0]}!`);
      if (u.role === "admin") {
        navigate({ to: "/admin/dashboard" });
      } else if (u.role === "vendor") {
        navigate({ to: "/vendor/dashboard" });
      } else {
        navigate({ to: "/customer/dashboard" });
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Failed to create account. Please try again.");
    }
  };

  return (
    <AuthShell title="Create your workspace" subtitle="Get up and running in under a minute" wide>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...form.register("confirm")} />
            {form.formState.errors.confirm && <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Account type</Label>
          <RadioGroup value={role} onValueChange={(v) => form.setValue("role", v as "customer" | "vendor" | "admin")} className="grid grid-cols-3 gap-2">
            {(["customer", "vendor", "admin"] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 text-sm capitalize hover:bg-accent/10 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value={r} /> {r}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {role === "vendor" && (
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" {...form.register("businessName")} />
              {form.formState.errors.businessName && <p className="text-xs text-destructive">{form.formState.errors.businessName.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" {...form.register("phone")} />
            {form.formState.errors.phone && <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={form.watch("terms")} onCheckedChange={(v) => form.setValue("terms", !!v, { shouldValidate: true })} />
          <span>I agree to the <a className="text-primary hover:underline" href="#">Terms of Service</a> and <a className="text-primary hover:underline" href="#">Privacy Policy</a>.</span>
        </label>
        {form.formState.errors.terms && <p className="text-xs text-destructive">{form.formState.errors.terms.message}</p>}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
