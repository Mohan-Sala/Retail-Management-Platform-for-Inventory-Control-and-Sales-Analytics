import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { shortDate } from "@/lib/format";

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const form = useForm({ defaultValues: { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", businessName: user?.businessName ?? "" } });
  const pw = useForm({ defaultValues: { current: "", next: "", confirm: "" } });
  const activity = Array.from({ length: 6 }, (_, i) => ({ t: shortDate(new Date(Date.now() - i * 3600000 * 6).toISOString()), a: ["Signed in", "Updated profile", "Generated report", "Approved vendor", "Exported CSV", "Changed password"][i] }));

  return (
    <div>
      <PageHeader title="My profile" description="Manage your account information and security." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14"><AvatarImage src={user?.avatar} /><AvatarFallback>{user?.name?.[0]}</AvatarFallback></Avatar>
            <div><div className="font-semibold">{user?.name}</div><div className="text-xs uppercase tracking-wider text-muted-foreground">{user?.role}</div></div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">Change avatar</Button>
          <div className="mt-6 border-t border-border pt-4 text-xs">
            <div className="text-muted-foreground">Email</div><div className="font-medium">{user?.email}</div>
            {user?.businessName && <><div className="mt-2 text-muted-foreground">Business</div><div className="font-medium">{user.businessName}</div></>}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit">Edit profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <form onSubmit={form.handleSubmit((v) => { updateUser(v); toast.success("Profile updated"); })} className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2"><Label>Full name</Label><Input {...form.register("name")} /></div>
                <div className="space-y-2"><Label>Email</Label><Input {...form.register("email")} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input {...form.register("phone")} /></div>
                {user?.role === "vendor" && <div className="space-y-2"><Label>Business name</Label><Input {...form.register("businessName")} /></div>}
                <div className="flex justify-end md:col-span-2"><Button type="submit">Save changes</Button></div>
              </form>
            </TabsContent>
            <TabsContent value="security">
              <form onSubmit={pw.handleSubmit(() => toast.success("Password updated"))} className="grid max-w-md gap-4">
                <div className="space-y-2"><Label>Current password</Label><Input type="password" {...pw.register("current")} /></div>
                <div className="space-y-2"><Label>New password</Label><Input type="password" {...pw.register("next")} /></div>
                <div className="space-y-2"><Label>Confirm new password</Label><Input type="password" {...pw.register("confirm")} /></div>
                <div className="flex justify-end"><Button type="submit">Update password</Button></div>
              </form>
            </TabsContent>
            <TabsContent value="activity">
              <div className="divide-y divide-border">
                {activity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 text-sm"><div>{a.a}</div><div className="text-xs text-muted-foreground">{a.t}</div></div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
