import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  role: z.enum(["admin", "vendor", "customer"]),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "" }),
  head: () => ({ meta: [{ title: "Sign in · ShopSense" }] }),
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", role: "admin" } });

  const onSubmit = async (v: FormValues) => {
    try {
      const u = await login(v.email, v.password, v.role);
      toast.success(`Welcome back, ${u.name}`);
      if (u.role === "admin") {
        navigate({ to: redirect || "/admin/dashboard" });
      } else if (u.role === "vendor") {
        navigate({ to: redirect || "/vendor/dashboard" });
      } else {
        navigate({ to: redirect || "/customer/dashboard" });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ShopSense workspace">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>I am signing in as</Label>
          <RadioGroup defaultValue="admin" onValueChange={(v) => form.setValue("role", v as "admin" | "vendor" | "customer")} className="grid grid-cols-3 gap-2">
            {(["admin", "vendor", "customer"] as const).map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 text-sm capitalize hover:bg-accent/10 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value={r} /> {r}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label></div>
          <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Sign in</Button>
        <p className="text-center text-xs text-muted-foreground">Don't have an account? <Link to="/register" className="text-primary hover:underline">Create one</Link></p>
      </form>
    </AuthShell>
  );
}
