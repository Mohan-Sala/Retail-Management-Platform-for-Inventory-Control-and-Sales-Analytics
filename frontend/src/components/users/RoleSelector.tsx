import React from "react";

interface RoleSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

/**
 * @desc Role selector dropdown for assigning user role parameters
 */
export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full text-foreground"
    >
      <option value="staff">Staff</option>
      <option value="manager">Manager</option>
      <option value="vendor">Vendor</option>
      <option value="admin">Admin</option>
    </select>
  );
}
export default RoleSelector;
