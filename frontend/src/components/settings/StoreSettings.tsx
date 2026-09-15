import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StoreSettingsProps {
  settings: any;
  onSubmit: (data: any) => void;
}

/**
 * @desc Editor for store name, email handles, default currencies, and currency symbols
 */
export function StoreSettings({ settings, onSubmit }: StoreSettingsProps) {
  const [formData, setFormData] = useState({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6 border border-border/40 bg-card rounded-xl text-left text-xs max-w-xl shadow-sm">
      <h3 className="text-sm font-bold text-foreground mb-4">Store Profile Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Store Name</label>
          <Input
            value={formData.storeName || ""}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            className="text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Support Email</label>
          <Input
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Currency Code</label>
            <Input
              value={formData.currency || "USD"}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Currency Symbol</label>
            <Input
              value={formData.currencySymbol || "$"}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}
export default StoreSettings;
