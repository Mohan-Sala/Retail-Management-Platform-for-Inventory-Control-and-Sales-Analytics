import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SupportChat } from "@/components/common/SupportChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ShieldCheck, Check } from "lucide-react";
import api from "@/lib/api";

export const Route = createFileRoute("/admin/support")({
  component: AdminSupport,
});

function AdminSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const [resolution, setResolution] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [closing, setClosing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, uRes] = await Promise.all([
        api.get("/support"),
        api.get("/users").catch(() => ({ data: [] })),
      ]);
      setTickets(tRes.data || []);
      const users = Array.isArray(uRes.data) ? uRes.data : uRes.data?.users || [];
      setStaffList(users.filter((u: any) => u.role === "admin" || u.role === "staff"));
      
      if (tRes.data && tRes.data.length > 0) {
        const currentSelected = selectedTicket ? tRes.data.find((t: any) => t._id === selectedTicket._id) : null;
        setSelectedTicket(currentSelected || tRes.data[0]);
      }
    } catch (e) {
      console.error("Failed to load tickets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignTicket = async () => {
    if (!selectedTicket || !assigneeId) return;

    try {
      await api.put(`/support/${selectedTicket._id}/assign`, { assigneeId });
      toast({ title: "Ticket Assigned", description: "Assigned staff member successfully." });
      await loadData();
    } catch (err: any) {
      toast({
        title: "Assignment Error",
        description: err.response?.data?.message || "Failed to assign ticket.",
        variant: "destructive",
      });
    }
  };

  const handleCloseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setClosing(true);
      await api.put(`/support/${selectedTicket._id}/close`, { resolution });
      toast({ title: "Ticket Closed", description: "Ticket resolved and marked closed successfully." });
      setResolution("");
      await loadData();
    } catch (err: any) {
      toast({
        title: "Close Error",
        description: err.response?.data?.message || "Failed to close ticket.",
        variant: "destructive",
      });
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Retrieving support board...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Support Desk"
        description="Review user issues, delegate staff assignments, and resolve platform support tickets."
      />

      {tickets.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-background/50 text-muted-foreground">
          <MessageSquare className="mx-auto w-10 h-10 text-muted-foreground/30 mb-2" />
          No support tickets are currently open on the platform.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 overflow-hidden border border-border/60">
            <div className="p-4 bg-muted/20 border-b border-border/50">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">All Platform Tickets</h3>
            </div>
            <div className="divide-y divide-border/40 max-h-[450px] overflow-y-auto">
              {tickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${
                    selectedTicket?._id === t._id ? "bg-primary/5 border-r-4 border-primary" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{t.category}</span>
                    <span className={`text-[8px] font-extrabold border px-1.5 py-0.5 rounded ${
                      t.status === "Closed" || t.status === "Resolved" ? "bg-emerald-500/10 text-emerald-500" :
                      t.status === "Open" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-foreground mt-1 truncate">{t.subject}</div>
                  <div className="text-[9px] text-muted-foreground mt-1 font-mono font-bold">{t.ticketNumber}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="md:col-span-2 space-y-4">
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-5 border border-border/60 space-y-3 bg-background/50 text-xs font-semibold">
                    <div className="flex justify-between items-start border-b pb-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Reference</span>
                        <h4 className="text-sm font-extrabold text-foreground">{selectedTicket.ticketNumber}</h4>
                      </div>
                      <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded">
                        Priority: <strong className="text-foreground">{selectedTicket.priority}</strong>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Subject</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{selectedTicket.subject}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Description</span>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed mt-0.5">{selectedTicket.description}</p>
                    </div>

                    {selectedTicket.resolution && (
                      <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                        <span className="text-[10px] uppercase font-black text-emerald-500 block flex items-center gap-1">
                          <ShieldCheck size={12} /> Support Resolution Note
                        </span>
                        <p className="text-xs text-foreground font-semibold">{selectedTicket.resolution}</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-5 border border-border/60 space-y-4 bg-background/50 text-xs font-semibold">
                    <h4 className="font-extrabold text-sm uppercase tracking-wider text-primary border-b pb-2">Ticket Management</h4>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground block">Assign Support Agent</label>
                      <div className="flex gap-2">
                        <select
                          className="flex-1 p-2 border rounded bg-background text-xs font-bold text-foreground"
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                        >
                          <option value="">Select agent...</option>
                          {staffList.map((st) => (
                            <option key={st._id} value={st._id}>{st.name} ({st.role})</option>
                          ))}
                        </select>
                        <Button size="icon" onClick={handleAssignTicket} disabled={!assigneeId}>
                          <Check size={14} />
                        </Button>
                      </div>
                    </div>

                    {selectedTicket.status !== "Closed" && (
                      <form onSubmit={handleCloseTicket} className="space-y-2 pt-2 border-t border-border/40">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block">Resolution Summary</label>
                        <Input
                          placeholder="E.g. Refund issued / Coupon sent"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          required
                          className="text-xs"
                        />
                        <Button type="submit" variant="default" disabled={closing} className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700">
                          {closing ? "Closing..." : "Close & Resolve Ticket"}
                        </Button>
                      </form>
                    )}
                  </Card>
                </div>

                <SupportChat
                  ticketId={selectedTicket._id}
                  messages={selectedTicket.messages || []}
                  currentUserId={user?.id || ""}
                  onNewMessage={loadData}
                  isClosed={selectedTicket.status === "Closed" || selectedTicket.status === "Resolved"}
                />
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl bg-background/50">
                Select a ticket from the left panel to manage resolution status.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
