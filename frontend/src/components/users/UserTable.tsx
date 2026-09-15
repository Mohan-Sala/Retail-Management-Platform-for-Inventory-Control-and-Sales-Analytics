import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, Shield } from "lucide-react";

interface UserTableProps {
  users: any[];
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermissions: (user: any) => void;
}

/**
 * @desc Table displaying users lists with toggles to edit, delete, restore, or edit custom permissions overrides
 */
export function UserTable({
  users,
  onEdit,
  onDelete,
  onRestore,
  onPermissions,
}: UserTableProps) {
  return (
    <Card className="border border-border/40 overflow-hidden rounded-xl shadow-sm text-left text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-semibold text-foreground">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{user.department || "N/A"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    user.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {user.status || "active"}
                  </span>
                </TableCell>
                <TableCell className="text-right flex justify-end gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => onPermissions(user)}>
                    <Shield className="h-3.5 w-3.5 mr-1" /> Perms
                  </Button>
                  {user.deletedAt ? (
                    <Button variant="ghost" size="sm" className="text-emerald-500" onClick={() => onRestore(user._id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDelete(user._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
export default UserTable;
