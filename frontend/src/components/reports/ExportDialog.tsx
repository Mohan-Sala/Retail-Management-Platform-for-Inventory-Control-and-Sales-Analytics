import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface ExportDialogProps {
  jobId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * @desc Track async report generation progress overlay
 */
export function ExportDialog({ jobId, onClose, onSuccess }: ExportDialogProps) {
  const [status, setStatus] = useState<string>("queued");
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const intervalId = setInterval(async () => {
      try {
        const res: any = await api.get(`/reports/queue/${jobId}`);
        const jobData = res.data || {};
        setStatus(jobData.status);
        setProgress(jobData.progress);
        setErrorMsg(jobData.errorMessage);

        if (jobData.status === "completed") {
          clearInterval(intervalId);
          toast.success("Report generated successfully!");
          onSuccess();
          onClose();
        } else if (jobData.status === "failed" || jobData.status === "cancelled") {
          clearInterval(intervalId);
          toast.error("Report generation terminated.");
        }
      } catch (err) {
        clearInterval(intervalId);
        toast.error("Failed to query job state");
        onClose();
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <Card className="w-full max-w-sm border border-border bg-card p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground">Compiling Document</h3>
          {(status === "failed" || status === "cancelled") && (
            <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          {status === "queued" && (
            <>
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Queued in worker pool...</span>
            </>
          )}
          {status === "processing" && (
            <>
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Generating pages ({progress}%)</span>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          {(status === "failed" || status === "cancelled") && (
            <>
              <AlertTriangle className="h-8 w-8 text-destructive animate-bounce" />
              <span className="text-xs text-destructive font-medium">Generation Failed</span>
              <p className="text-[11px] text-muted-foreground text-center">{errorMsg || "Unknown compilation error"}</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
