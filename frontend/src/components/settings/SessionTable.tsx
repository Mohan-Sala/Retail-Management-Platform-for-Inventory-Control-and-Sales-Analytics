import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SessionTableProps {
  sessions: any[];
  onTerminate: (id: string) => void;
  onTerminateAll: () => void;
}

/**
 * @desc Displays active devices list, browser agents, source IP locations, and logouts triggers
 */
export function SessionTable({
  sessions,
  onTerminate,
  onTerminateAll,
}: SessionTableProps) {
  return (
    <Card className="border border-border/40 overflow-hidden rounded-xl shadow-sm text-left text-xs space-y-4 p-4 bg-card">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-foreground">Active Login Sessions</h4>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={onTerminateAll}>
            Terminate Other Sessions
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device/Browser</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Login Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                No active login sessions tracked.
              </TableCell>
            </TableRow>
          ) : (
            sessions.map((sess) => (
              <TableRow key={sess.sessionId}>
                <TableCell>
                  <span className="font-semibold block text-foreground">{sess.browser || "Unknown"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {sess.deviceType || "Desktop"} ({sess.operatingSystem || "Windows"})
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[10px]">{sess.ipAddress}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(sess.loginAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onTerminate(sess.sessionId)}>
                    Terminate
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
export default SessionTable;
