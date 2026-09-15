import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecuritySettingsProps {
  settings: any;
  onSubmit: (data: any) => void;
}

/**
 * @desc Editor subform for toggling maintenance locks, retention days limit, and session timeout minutes
 */
export function SecuritySettings({
  settings,
  onSubmit,
}: SecuritySettingsProps) {
  const [formData, setFormData] = useState({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6 border border-border/40 bg-card rounded-xl text-left text-xs max-w-xl shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Security Policies Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between p-2.5 bg-background border border-border/20 rounded-lg">
          <div>
            <span className="font-semibold block text-foreground">Maintenance Mode</span>
            <span className="text-[10px] text-muted-foreground">Force-rejects all incoming API traffic from non-admin accounts.</span>
          </div>
          <input
            type="checkbox"
            checked={formData.maintenanceMode || false}
            onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
            className="h-4 w-4 text-primary accent-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Maintenance Message</label>
          <Input
            value={formData.maintenanceMessage || ""}
            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
            className="text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Retention Days (Data cleanup)</label>
            <Input
              type="number"
              value={formData.retentionDays || 90}
              onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
              className="text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Session Expiry (minutes)</label>
            <Input
              type="number"
              value={formData.sessionTimeout || 60}
              onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
              className="text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit">Save Security Settings</Button>
        </div>
      </form>
    </Card>
  );
}
export default SecuritySettings;
