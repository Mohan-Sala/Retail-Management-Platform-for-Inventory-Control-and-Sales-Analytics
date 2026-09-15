import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Copy, Check } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface ShareDialogProps {
  reportId: string | null;
  onClose: () => void;
}

/**
 * @desc Configuration box generating shared tokens and password limits
 */
export function ShareDialog({ reportId, onClose }: ShareDialogProps) {
  const [password, setPassword] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    if (!reportId) return;
    try {
      const res: any = await api.post(`/reports/share/${reportId}`, {
        password: password.trim() || undefined,
        expiryDays: Number(expiryDays),
      });
      const token = res.data?.shareToken;
      const link = `${window.location.origin}/api/reports/shared/${token}`;
      setShareLink(link);
      toast.success("Shared link generated!");
    } catch (e) {
      toast.error("Failed to generate link");
    }
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!reportId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm border border-border bg-card p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">Secure Share Link</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>

        {shareLink ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Anyone with this link and password (if set) can access the report:</p>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-lg p-2 text-xs">
              <span className="truncate flex-1 select-all text-foreground">{shareLink}</span>
              <button onClick={handleCopy} className="p-1 hover:bg-muted rounded text-muted-foreground">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Access Password (Optional)</label>
              <input
                type="password"
                placeholder="Secure password constraint..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">Link Expiration (Days)</label>
              <input
                type="number"
                min={1}
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 1)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button onClick={handleGenerateLink} className="w-full">Generate Secure Link</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
