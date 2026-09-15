import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import api from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res: any = await api.get("/profile");
      setUser(res.data);
    } catch (e) {
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateInfo = async (data: any) => {
    try {
      const res: any = await api.put("/profile", data);
      toast.success("Profile details updated successfully");
      setUser(res.data);
    } catch (e) {
      toast.error("Profile updates failed");
    }
  };

  const handleChangePassword = async (data: any) => {
    try {
      await api.put("/profile/password", data);
      toast.success("Password changed successfully");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Password updates failed");
    }
  };

  const handleAvatarUpload = async (base64: string) => {
    try {
      const res: any = await api.post("/profile/avatar", { avatar: base64 });
      toast.success("Avatar image uploaded successfully");
      setUser(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Avatar uploads failed");
    }
  };

  return (
    <div className="space-y-6 text-xs text-left">
      <PageHeader
        title="My User Account Profile"
        description="View role permissions and manage personal settings details."
      />

      {loading || !user ? (
        <div className="text-muted-foreground text-center py-6">Loading profile...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6">
            <ProfileCard user={user} />
            <AvatarUploader onUpload={handleAvatarUpload} />
          </div>
          <div className="md:col-span-2">
            <ProfileEditor
              user={user}
              onSubmit={handleUpdateInfo}
              onSubmitPassword={handleChangePassword}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default ProfilePage;
