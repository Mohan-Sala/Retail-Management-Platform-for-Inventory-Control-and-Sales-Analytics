import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { UserTable } from "@/components/users/UserTable";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/manager/users")({
  component: ManagerUsersPage,
});

function ManagerUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/users?role=staff");
      setUsers(res.data?.users || []);
    } catch (e) {
      toast.error("Failed to load team users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 text-xs text-left">
      <PageHeader
        title="Team Directory"
        description="Monitor staff account statuses and assignments."
      />

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Loading team members...</div>
      ) : (
        <UserTable
          users={users}
          onEdit={() => toast.info("Managers are not authorized to edit users")}
          onDelete={() => toast.info("Managers are not authorized to delete users")}
          onRestore={() => {}}
          onPermissions={() => {}}
        />
      )}
    </div>
  );
}
export default ManagerUsersPage;
