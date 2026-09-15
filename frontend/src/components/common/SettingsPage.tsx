import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <PageHeader title="Settings" description="Preferences, notifications, and workspace controls." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 text-sm font-semibold">General</div>
          <div className="grid gap-4">
            <div className="space-y-2"><Label>Workspace name</Label><Input defaultValue="ShopSense HQ" /></div>
            <div className="space-y-2"><Label>Support email</Label><Input defaultValue="support@shopsense.io" /></div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select defaultValue="INR">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["INR", "USD", "EUR", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-4 text-sm font-semibold">Appearance</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><div className="text-sm font-medium">Theme</div><div className="text-xs text-muted-foreground">Toggle light or dark mode</div></div>
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[["en", "English"], ["hi", "Hindi"], ["es", "Spanish"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="mb-4 text-sm font-semibold">Notifications</div>
          {[["Order alerts", "When new orders are placed"], ["Low stock alerts", "When SKUs fall below reorder"], ["Weekly summary", "Every Monday at 9:00 AM"], ["Product updates", "New features and improvements"]].map(([t, d]) => (
            <div key={t} className="flex items-center justify-between py-3">
              <div><div className="text-sm font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
              <Switch defaultChecked />
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <div className="mb-4 text-sm font-semibold">Account</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><div>Two-factor auth</div><Switch /></div>
            <div className="flex items-center justify-between"><div>Login alerts</div><Switch defaultChecked /></div>
            <div className="pt-3"><Button variant="destructive" onClick={() => toast.success("Requested — check email")}>Delete workspace</Button></div>
          </div>
        </Card>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={() => toast.success("Settings saved")}>Save settings</Button></div>
    </div>
  );
}
