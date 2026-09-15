import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, User } from "lucide-react";
import api from "@/lib/api";

interface Message {
  senderId: string;
  message: string;
  sentAt: string;
}

interface SupportChatProps {
  ticketId: string;
  messages: Message[];
  currentUserId: string;
  onNewMessage: () => void;
  isClosed: boolean;
}

export function SupportChat({
  ticketId,
  messages,
  currentUserId,
  onNewMessage,
  isClosed,
}: SupportChatProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setSending(true);
      await api.post(`/support/${ticketId}/reply`, { message: text });
      setText("");
      onNewMessage();
    } catch (err: any) {
      toast({
        title: "Reply Error",
        description: err.response?.data?.message || "Failed to post message reply.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-border/60 rounded-xl overflow-hidden bg-background/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground p-8">No messages in this ticket thread yet.</div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={i} className={`flex gap-2.5 max-w-[75%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className="w-8 h-8 rounded-full bg-muted border border-border/60 flex items-center justify-center shrink-0">
                  <User size={14} className="text-muted-foreground" />
                </div>
                <div className={`p-3 rounded-2xl text-xs font-semibold ${
                  isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
                }`}>
                  <p className="leading-relaxed">{msg.message}</p>
                  <span className={`block text-[8px] mt-1.5 text-right font-medium ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border/50 bg-muted/20 flex gap-2">
        <Input
          placeholder={isClosed ? "This ticket is closed." : "Type your message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isClosed || sending}
          className="text-xs"
        />
        <Button size="icon" type="submit" disabled={isClosed || sending || !text.trim()}>
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
