import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { UserTable } from "@/components/users/UserTable";
import { UserForm } from "@/components/users/UserForm";
import { PermissionMatrix } from "@/components/users/PermissionMatrix";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPerms, setShowPerms] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = [];
      if (filters.search) queryParams.push(`search=${filters.search}`);
      if (filters.role) queryParams.push(`role=${filters.role}`);

      const res: any = await api.get(`/users?${queryParams.join("&")}`);
      setUsers(res.data?.users || []);
    } catch (e) {
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser._id}`, data);
        toast.success("User updated successfully");
      } else {
        await api.post("/users", data);
        toast.success("User created successfully");
      }
      setShowForm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success("User soft-deleted successfully");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Deletion failed");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.put(`/users/${id}/restore`);
      toast.success("User restored successfully");
      fetchUsers();
    } catch (e) {
      toast.error("Restoring user failed");
    }
  };

  const handleApplyPermissions = async (perms: string[]) => {
    try {
      await api.put(`/users/${showPerms._id}/permissions`, { permissions: perms });
      toast.success("Granular permissions override updated successfully");
      setShowPerms(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update permissions");
    }
  };

  return (
    <div className="space-y-6 text-xs text-left">
      <div className="flex justify-between items-start">
        <PageHeader
          title="User Account Management"
          description="Manage administrative accounts, role levels, granular permissions overrides, and locks."
        />
        <Button size="sm" onClick={() => { setSelectedUser(null); setShowForm(true); }} className="mt-4">
          <Plus className="h-4 w-4 mr-1.5" /> Create User
        </Button>
      </div>

      <div className="flex gap-4 bg-card p-4 rounded-xl border border-border/40 max-w-md items-end">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Filter by Role</label>
          <select
            value={filters.role || ""}
            onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined })}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Roles</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <UserForm
            user={selectedUser}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => { setShowForm(false); setSelectedUser(null); }}
          />
        </div>
      )}

      {showPerms && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <PermissionMatrix
            user={showPerms}
            onSubmit={handleApplyPermissions}
            onCancel={() => setShowPerms(null)}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading user lists...</div>
      ) : (
        <UserTable
          users={users}
          onEdit={(u) => { setSelectedUser(u); setShowForm(true); }}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onPermissions={(u) => setShowPerms(u)}
        />
      )}
    </div>
  );
}
