import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Phone, Calendar, Shield, CreditCard, ShoppingBag, Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { inr, num } from "@/lib/format";
import api from "@/lib/api";

export const Route = createFileRoute("/customer/profile")({
  component: CustomerProfile,
});

function CustomerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res: any = await api.get("/profile");
        setProfile(res.data);
      } catch (e) {
        console.error("Failed to load customer profile:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  const spent = profile?.customerProfile?.totalSpent || 0;
  const ordersCount = profile?.customerProfile?.totalOrders || 0;
  
  let rank = "Bronze";
  if (spent >= 20000) rank = "Gold";
  else if (spent >= 5000) rank = "Silver";

  const getRankBadgeClass = (r: string) => {
    if (r === "Gold") return "bg-amber-500/10 text-amber-500 border-amber-500/25";
    if (r === "Silver") return "bg-slate-400/10 text-slate-400 border-slate-400/25";
    return "bg-amber-700/10 text-amber-700 border-amber-700/25";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Profile Card"
        description="Manage your account profile details, credentials, and track your marketplace membership tiers."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-6 border border-border/60 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h3 className="font-bold text-base">{profile?.name}</h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 block">
              {profile?.role} Console
            </span>
          </div>

          <div className={`text-[11px] uppercase font-extrabold border px-3 py-1 rounded-full ${getRankBadgeClass(rank)}`}>
            {rank} Tier Member
          </div>
        </Card>

        {/* Credentials Details */}
        <Card className="p-6 border border-border/60 md:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold border-b border-border/40 pb-3">Account Specifications</h3>
          
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</div>
                <div className="font-semibold mt-0.5">{profile?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</div>
                <div className="font-semibold mt-0.5">{profile?.phone || "Not provided"}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Member Since</div>
                <div className="font-semibold mt-0.5">
                  {profile?.customerProfile?.customerSince 
                    ? new Date(profile.customerProfile.customerSince).toLocaleDateString()
                    : new Date(profile?.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Account Status</div>
                <div className="font-semibold capitalize mt-0.5 text-primary">Active</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Shopping statistics summary */}
      <Card className="p-6 border border-border/60 space-y-4">
        <h3 className="text-sm font-semibold border-b border-border/40 pb-3">Shopping Metrics Summaries</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Spent</div>
              <div className="font-mono font-bold text-sm mt-0.5">{inr(spent)}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-accent shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Total Orders</div>
              <div className="font-mono font-bold text-sm mt-0.5">{num(ordersCount)}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/20 border border-border/40 flex items-center gap-3">
            <Star className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Favorite Vendor</div>
              <div className="font-semibold text-xs mt-0.5 truncate max-w-[150px]">
                {profile?.customerProfile?.favoriteVendorName || "No favorite yet"}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
