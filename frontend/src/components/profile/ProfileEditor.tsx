import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileEditorProps {
  user: any;
  onSubmit: (data: any) => void;
  onSubmitPassword: (data: any) => void;
}

/**
 * @desc Form to modify profile details and change user password variables
 */
export function ProfileEditor({
  user,
  onSubmit,
  onSubmitPassword,
}: ProfileEditorProps) {
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    department: user?.department || "",
    designation: user?.designation || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPassword(passwordData);
    setPasswordData({ currentPassword: "", newPassword: "" });
  };

  return (
    <div className="space-y-6 max-w-xl text-xs text-left">
      <Card className="p-6 border border-border/40 bg-card rounded-xl shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Edit Profile Info</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
            <Input
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</label>
            <Input
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Department</label>
              <Input
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                className="text-foreground"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Designation</label>
              <Input
                value={profileData.designation}
                onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                className="text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Update Info</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 border border-border/40 bg-card rounded-xl shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Current Password</label>
            <Input
              required
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="text-foreground"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password</label>
            <Input
              required
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="text-foreground"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit">Change Password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
export default ProfileEditor;
