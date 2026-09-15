import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PermissionMatrixProps {
  user: any;
  onSubmit: (permissions: string[]) => void;
  onCancel: () => void;
}

/**
 * @desc Configuration matrix showing all system permissions flags, supporting granular assignments overrides
 */
export function PermissionMatrix({
  user,
  onSubmit,
  onCancel,
}: PermissionMatrixProps) {
  const allPermissions = [
    "products.read",
    "products.write",
    "vendors.read",
    "vendors.write",
    "customers.read",
    "customers.write",
    "transactions.read",
    "transactions.write",
    "inventory.read",
    "inventory.write",
    "reports.read",
    "reports.generate",
    "analytics.read",
    "recommendations.read",
    "businessInsights.read",
    "notifications.read",
    "notifications.manage",
    "users.read",
    "users.write",
    "settings.read",
    "settings.write",
    "system.read",
    "system.write",
  ];

  const [selected, setSelected] = useState<string[]>(user?.preferences?.permissions || []);

  const handleToggle = (perm: string) => {
    if (selected.includes(perm)) {
      setSelected(selected.filter((p) => p !== perm));
    } else {
      setSelected([...selected, perm]);
    }
  };

  const handleSave = () => {
    onSubmit(selected);
  };

  return (
    <Card className="p-6 border border-border bg-card rounded-xl text-left text-xs max-w-xl w-full shadow-lg">
      <h3 className="text-sm font-bold text-foreground mb-1">Granular Override Permissions Matrix</h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        User: <strong className="text-foreground">{user.name}</strong> ({user.role})
      </p>

      <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto border border-border/20 p-3 rounded-lg bg-background/50">
        {allPermissions.map((perm) => (
          <div key={perm} className="flex items-center gap-2 p-1.5 bg-background rounded-lg border border-border/10">
            <input
              type="checkbox"
              checked={selected.includes(perm)}
              onChange={() => handleToggle(perm)}
              className="h-3.5 w-3.5 text-primary accent-primary"
            />
            <span className="font-mono text-[10px] text-foreground/80">{perm}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSave}>Apply Overrides</Button>
      </div>
    </Card>
  );
}
export default PermissionMatrix;
