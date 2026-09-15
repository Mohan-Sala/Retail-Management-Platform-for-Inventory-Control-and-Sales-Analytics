import React from "react";
import { Card } from "@/components/ui/card";

interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * @desc Sidebar tab layout coordinate panel for sub-configuration segments
 */
export function SettingsLayout({
  children,
  activeTab,
  setActiveTab,
}: SettingsLayoutProps) {
  const tabs = [
    { id: "store", label: "Store Info" },
    { id: "security", label: "Security & Expiry" },
    { id: "sessions", label: "Active Sessions" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 text-xs text-left">
      <Card className="p-4 border border-border/40 bg-card rounded-xl shadow-sm shrink-0 w-full md:w-[180px] h-fit flex flex-col gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </Card>
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
export default SettingsLayout;
