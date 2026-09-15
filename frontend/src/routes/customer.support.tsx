import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { SupportChat } from "@/components/common/SupportChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, ShieldCheck } from "lucide-react";
import { inr } from "@/lib/format";
import api from "@/lib/api";

export const Route = createFileRoute("/customer/support")({
  component: CustomerSupport,
});

function CustomerSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState("Medium");
  const [orderId, setOrderId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, oRes] = await Promise.all([
        api.get("/support"),
        api.get("/orders"),
      ]);
      setTickets(tRes.data || []);
      setOrders(oRes.data || []);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({ title: "Validation Error", description: "Subject and description are required.", variant: "destructive" });
      return;
    }

    try {
      await api.post("/support", {
        subject,
        description,
        category,
        priority,
        orderId: orderId || undefined,
      });
      toast({ title: "Ticket Raised", description: "Support request registered successfully." });
      setSubject("");
      setDescription("");
      setShowCreate(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: "Ticket Error",
        description: err.response?.data?.message || "Failed to create support ticket.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Retrieving support threads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Customer Support Desk"
          description="Submit questions, report shipping issues, or chat with support staff representatives."
        />
        <Button onClick={() => setShowCreate(!showCreate)} className="font-bold flex items-center gap-1">
          <Plus size={16} /> Raise Ticket
        </Button>
      </div>

      {showCreate && (
        <Card className="p-5 border border-dashed border-primary/50 max-w-xl bg-background/50">
          <h3 className="font-extrabold text-sm uppercase tracking-wider mb-4 text-primary">Raise a Support Ticket</h3>
          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-semibold">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Category</label>
                <select className="w-full p-2 border rounded bg-background text-xs text-foreground font-semibold" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Billing">Billing / Invoice</option>
                  <option value="Return">Return / Refund</option>
                  <option value="Shipping">Shipping / Carrier</option>
                  <option value="Other">Other Issues</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Priority</label>
                <select className="w-full p-2 border rounded bg-background text-xs text-foreground font-semibold" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Associated Order (Optional)</label>
              <select className="w-full p-2 border rounded bg-background text-xs text-foreground font-semibold" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">No order association</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>{o.orderNumber} - {inr(o.totalAmount)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Subject</label>
              <Input placeholder="Brief title summarizing the problem..." value={subject} onChange={(e) => setSubject(e.target.value)} required className="text-xs" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Description</label>
              <Textarea placeholder="Explain your problem in detail..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="text-xs animate-none" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" size="sm">Submit Ticket</Button>
            </div>
          </form>
        </Card>
      )}

      {tickets.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-background/50 text-muted-foreground">
          <MessageSquare className="mx-auto w-10 h-10 text-muted-foreground/30 mb-2" />
          You have no active support ticket logs.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 overflow-hidden border border-border/60">
            <div className="p-4 bg-muted/20 border-b border-border/50">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">Tickets List</h3>
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
                <Card className="p-5 border border-border/60 space-y-3 bg-background/50">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Ticket Reference</span>
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
                    <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                      <span className="text-[10px] uppercase font-black text-emerald-500 block flex items-center gap-1">
                        <ShieldCheck size={12} /> Support Resolution Note
                      </span>
                      <p className="text-xs text-foreground font-semibold">{selectedTicket.resolution}</p>
                    </div>
                  )}
                </Card>

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
                Select a ticket from the left panel to review replies history.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
