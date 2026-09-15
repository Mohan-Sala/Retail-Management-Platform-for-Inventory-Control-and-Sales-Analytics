import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface AuditLogTableProps {
  logs: any[];
}

/**
 * @desc Table displaying logs of user actions, methods, status outputs, and source IP addresses
 */
export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <Card className="border border-border/40 overflow-hidden rounded-xl shadow-sm text-left text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No audit log trails found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell className="font-mono text-[10px]">{log.userId || "System"}</TableCell>
                <TableCell className="capitalize">{log.userRole || "System"}</TableCell>
                <TableCell className="font-mono text-[10px] text-foreground">{log.action}</TableCell>
                <TableCell>{log.module}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status < 400 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    {log.status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[10px]">{log.ipAddress}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
export default AuditLogTable;
