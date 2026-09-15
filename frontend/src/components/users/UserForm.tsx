import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleSelector } from "./RoleSelector";

interface UserFormProps {
  user?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

/**
 * @desc Form dialog to specify name, email, department, role, and password variables
 */
export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "staff",
    department: user?.department || "",
    designation: user?.designation || "",
    phone: user?.phone || "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="p-6 border border-border bg-card rounded-xl text-left text-xs max-w-md w-full shadow-lg">
      <h3 className="text-sm font-bold text-foreground mb-4">
        {user ? "Modify User Settings" : "Create User Profile"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-foreground"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
          <Input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="text-foreground"
          />
        </div>

        {!user && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Initial Password</label>
            <Input
              required
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="text-foreground"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Assign Role</label>
            <RoleSelector value={formData.role} onChange={(val) => setFormData({ ...formData, role: val })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Card>
  );
}
export default UserForm;
