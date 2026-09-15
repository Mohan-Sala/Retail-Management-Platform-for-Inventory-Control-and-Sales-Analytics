import React, { useEffect, useState } from "react";
import { 
  FileText, Download, Share2, History, Trash2, Calendar, 
  Settings, CheckCircle, BarChart3, Database, ShieldAlert 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters } from "./ReportFilters";
import { ExportDialog } from "./ExportDialog";
import { ShareDialog } from "./ShareDialog";
import { ReportVersionsDialog } from "./ReportVersionsDialog";
import api from "@/lib/api";
import { toast } from "sonner";

interface ReportsManagementProps {
  role: "admin" | "vendor" | "manager" | "staff";
}

interface ReportItem {
  _id: string;
  title: string;
  type: string;
  format: string;
  status: string;
  fileSize: number;
  downloadCount: number;
  shareCount: number;
  createdAt: string;
}

export function ReportsManagement({ role }: ReportsManagementProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [type, setType] = useState("product");
  const [format, setFormat] = useState("pdf");

  // Dialog control states
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [shareReportId, setShareReportId] = useState<string | null>(null);
  const [versionsReportId, setVersionsReportId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch History
      const histRes: any = await api.get("/reports/history?limit=100");
      setReports(histRes.data?.reports || []);

      // Fetch Analytics
      const analyticRes: any = await api.get("/reports/analytics");
      setAnalytics(analyticRes.data || null);
    } catch (e) {
      console.error("Failed to load reporting data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    try {
      const res: any = await api.post("/reports/generate", {
        title: `${type.toUpperCase()} Report ${new Date().toLocaleDateString()}`,
        type,
        format,
        filters: {}
      });
      if (res.data?.jobId) {
        setActiveJobId(res.data.jobId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger report compilation");
    }
  };

  const handleDownload = (r: ReportItem) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const token = localStorage.getItem("shopsense.auth.token");
    window.open(`${baseUrl}/reports/download/${r._id}?token=${token}`, "_blank");
    toast.success("Download started!");
    
    // Refresh history metadata counters shortly after
    setTimeout(loadData, 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this report from history?")) {
      try {
        await api.delete(`/reports/history/${id}`);
        toast.success("Report deleted");
        loadData();
      } catch (e) {
        toast.error("Failed to delete report");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Picker */}
      <ReportFilters
        type={type}
        setType={setType}
        format={format}
        setFormat={setFormat}
        onGenerate={handleGenerate}
      />

      {/* Analytics Summaries */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{analytics.totalReports || 0}</div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Total Reports</div>
            </div>
          </Card>

          <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{analytics.successRate || 100}%</div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Success Rate</div>
            </div>
          </Card>

          <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((analytics.totalStorageUsageBytes || 0) / 1024)} KB
              </div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Storage Footprint</div>
            </div>
          </Card>

          <Card className="p-4 border border-border/40 bg-card/60 backdrop-blur-md flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{analytics.totalSchedules || 0}</div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Active Schedules</div>
            </div>
          </Card>
        </div>
      )}

      {/* History Log Table */}
      <Card className="border border-border/40 bg-card/30 rounded-xl overflow-hidden shadow-sm">
        <div className="border-b border-border/40 px-6 py-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Report Archives & Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-4">Report Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Format</th>
                <th className="p-4">Completed On</th>
                <th className="p-4">Metrics</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">Loading report logs...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">No reports generated yet.</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id} className="border-b border-border/30 hover:bg-muted/10 transition-colors text-foreground">
                    <td className="p-4">
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-[10px] text-muted-foreground">ID: {r._id}</div>
                    </td>
                    <td className="p-4 capitalize">{r.type}</td>
                    <td className="p-4 font-bold uppercase">{r.format}</td>
                    <td className="p-4 text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "Pending"}
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] text-muted-foreground">
                        Downloads: {r.downloadCount} | Shares: {r.shareCount}
                      </div>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      {r.status === "completed" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(r)} title="Download file" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setShareReportId(r._id)} title="Share link" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setVersionsReportId(r._id)} title="Version history" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <History className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r._id)} title="Remove entry" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dialog Modals */}
      <ExportDialog
        jobId={activeJobId}
        onClose={() => setActiveJobId(null)}
        onSuccess={loadData}
      />

      <ShareDialog
        reportId={shareReportId}
        onClose={() => setShareReportId(null)}
      />

      <ReportVersionsDialog
        reportId={versionsReportId}
        onClose={() => setVersionsReportId(null)}
      />
    </div>
  );
}
export default ReportsManagement;
