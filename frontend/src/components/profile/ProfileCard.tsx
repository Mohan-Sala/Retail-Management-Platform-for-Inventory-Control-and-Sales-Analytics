import React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileCardProps {
  user: any;
}

/**
 * @desc Card layout displaying user avatar images, names, roles, and status indicators
 */
export function ProfileCard({ user }: ProfileCardProps) {
  if (!user) return null;

  return (
    <Card className="p-6 border border-border/40 bg-card rounded-xl text-left text-xs max-w-sm w-full flex flex-col items-center shadow-sm gap-4">
      <Avatar className="h-20 w-20 border-2 border-primary/20">
        <AvatarImage src={user.avatar || ""} />
        <AvatarFallback className="text-xl font-bold">{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="text-center">
        <h4 className="text-sm font-bold text-foreground">{user.name}</h4>
        <span className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5 block">{user.role}</span>
      </div>
      <div className="w-full border-t border-border/30 pt-4 space-y-2.5 text-muted-foreground">
        <div className="flex justify-between">
          <span>Email:</span>
          <strong className="text-foreground">{user.email}</strong>
        </div>
        <div className="flex justify-between">
          <span>Department:</span>
          <strong className="text-foreground">{user.department || "N/A"}</strong>
        </div>
        <div className="flex justify-between">
          <span>Designation:</span>
          <strong className="text-foreground">{user.designation || "N/A"}</strong>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <strong className="text-emerald-500 uppercase">{user.status}</strong>
        </div>
      </div>
    </Card>
  );
}
export default ProfileCard;
