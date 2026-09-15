import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, History } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface VersionItem {
  _id: string;
  version: number;
  format: string;
  fileSize: number;
  completedAt: string;
  fileUrl: string;
}

interface ReportVersionsDialogProps {
  reportId: string | null;
  onClose: () => void;
}

/**
 * @desc Modal displaying different report compile iterations
 */
export function ReportVersionsDialog({
  reportId,
  onClose,
}: ReportVersionsDialogProps) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportId) return;

    const loadVersions = async () => {
      try {
        setLoading(true);
        const res: any = await api.get(`/reports/history/${reportId}/versions`);
        setVersions(res.data || []);
      } catch (e) {
        toast.error("Failed to load versions list");
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [reportId]);

  const handleDownload = (v: VersionItem) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("shopsense.auth.token");
    window.open(`${baseUrl}/reports/download/${v._id}?token=${token}`, "_blank");
    toast.success("Download started!");
  };

  if (!reportId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-md border border-border bg-card p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Report Versions Linkage
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center text-xs text-muted-foreground py-6">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-6">No previous versions found.</div>
          ) : (
            versions.map((v) => (
              <div key={v._id} className="flex justify-between items-center border-b border-border/40 py-2.5 text-xs text-foreground">
                <div>
                  <div className="font-semibold">Version #{v.version} ({v.format.toUpperCase()})</div>
                  <div className="text-[10px] text-muted-foreground">
                    Generated: {new Date(v.completedAt).toLocaleString()} · {Math.round((v.fileSize || 0) / 1024)} KB
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(v)} className="text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
export default ReportVersionsDialog;
