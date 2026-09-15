import React from "react";
import { Card } from "@/components/ui/card";
import { Server, Database, Activity } from "lucide-react";

interface SystemHealthCardProps {
  server: any;
  database: any;
}

/**
 * @desc Server health parameters (CPU load, memory allocation, and Mongo DB ping latency)
 */
export function SystemHealthCard({ server, database }: SystemHealthCardProps) {
  if (!server || !database) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3 text-left text-xs">
      <Card className="p-4 border border-border/40 bg-card rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
          <Server className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">Server CPU Load</div>
          <div className="text-xl font-bold text-foreground mt-0.5">{(server.cpuUsage * 100).toFixed(1)}%</div>
          <span className="text-[10px] text-muted-foreground">Uptime: {(server.uptime / 3600).toFixed(1)} hours</span>
        </div>
      </Card>

      <Card className="p-4 border border-border/40 bg-card rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">Memory Heap</div>
          <div className="text-xl font-bold text-foreground mt-0.5">{(server.heapUsed / 1024 / 1024).toFixed(1)} MB</div>
          <span className="text-[10px] text-muted-foreground">Total Alloc: {(server.heapTotal / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </Card>

      <Card className="p-4 border border-border/40 bg-card rounded-xl flex items-center gap-3">
        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground">MongoDB Ping</div>
          <div className="text-xl font-bold text-foreground mt-0.5">{database.latencyMs} ms</div>
          <span className={`text-[10px] ${database.connected ? "text-emerald-500" : "text-red-500"}`}>
            {database.connected ? "Operational" : "Disconnected"}
          </span>
        </div>
      </Card>
    </div>
  );
}
export default SystemHealthCard;
