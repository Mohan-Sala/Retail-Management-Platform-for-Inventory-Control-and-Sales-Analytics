import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

/**
 * @desc User preferences panel toggling notification types, categories, and quiet hours
 */
export function NotificationPreferences() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res: any = await api.get("/notifications/preferences");
        const data = res.data || {};
        setEmailEnabled(data.emailEnabled ?? true);
        setInAppEnabled(data.inAppEnabled ?? true);
        setPushEnabled(data.pushEnabled ?? false);
        setCategories(data.categories || []);
        setQuietHoursStart(data.quietHours?.start || "");
        setQuietHoursEnd(data.quietHours?.end || "");
      } catch (e) {
        console.error("Failed to load settings");
      }
    };
    fetchPrefs();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put("/notifications/preferences", {
        emailEnabled,
        inAppEnabled,
        pushEnabled,
        categories,
        quietHours: {
          start: quietHoursStart,
          end: quietHoursEnd,
        }
      });
      toast.success("Preferences updated successfully");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(prev => prev.filter(c => c !== cat));
    } else {
      setCategories(prev => [...prev, cat]);
    }
  };

  const allCategories = ["inventory", "sales", "customer", "vendor", "forecast", "reports", "ai", "system"];

  return (
    <Card className="p-6 border border-border/40 bg-card/60 backdrop-blur-md max-w-xl space-y-6 rounded-xl shadow-sm">
      <div className="space-y-1 border-b border-border/40 pb-4 text-left">
        <h3 className="text-sm font-bold text-foreground">Alert Channel Configurations</h3>
        <p className="text-[10px] text-muted-foreground">Select preferred routes and hours to dispatch system alerts.</p>
      </div>

      <div className="space-y-4 text-left">
        <div className="flex justify-between items-center py-2 border-b border-border/20">
          <div>
            <label className="text-xs font-semibold text-foreground">In-App Notification Center</label>
            <p className="text-[10px] text-muted-foreground">Receive real-time banners and badging.</p>
          </div>
          <input
            type="checkbox"
            checked={inAppEnabled}
            onChange={(e) => setInAppEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border/20">
          <div>
            <label className="text-xs font-semibold text-foreground">Email Dispatches</label>
            <p className="text-[10px] text-muted-foreground">Receive digest summaries at your email.</p>
          </div>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="flex justify-between items-center py-2 border-b border-border/20">
          <div>
            <label className="text-xs font-semibold text-foreground">Push Notifications</label>
            <p className="text-[10px] text-muted-foreground">Receive updates on your desktop / device browser.</p>
          </div>
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-foreground">Quiet Hours Interval</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">Start Time</span>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">End Time</span>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-foreground">Selected Categories</label>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-xs text-foreground capitalize cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => handleToggleCategory(cat)}
                  className="w-3.5 h-3.5 rounded text-primary accent-primary"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full h-10 shadow-sm mt-4">
        {loading ? "Saving Changes..." : "Save Settings"}
      </Button>
    </Card>
  );
}
export default NotificationPreferences;
