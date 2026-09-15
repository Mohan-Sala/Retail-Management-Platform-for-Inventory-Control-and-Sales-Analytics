import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface ApiUsageTableProps {
  metrics: any[];
}

/**
 * @desc Displays HTTP methods, routing paths, overall request counts, latencies, and failed errors
 */
export function ApiUsageTable({ metrics }: ApiUsageTableProps) {
  return (
    <Card className="border border-border/40 overflow-hidden rounded-xl shadow-sm text-left text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Requests</TableHead>
            <TableHead>Errors</TableHead>
            <TableHead>Avg Latency</TableHead>
            <TableHead>Max Latency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No API usage statistics captured.
              </TableCell>
            </TableRow>
          ) : (
            metrics.map((metric) => (
              <TableRow key={`${metric.method}-${metric.endpoint}`}>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    metric.method === "GET" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {metric.method}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-foreground">{metric.endpoint}</TableCell>
                <TableCell className="font-mono text-[10px]">{metric.totalRequests}</TableCell>
                <TableCell className="font-mono text-[10px] text-red-500">{metric.failedRequests}</TableCell>
                <TableCell className="font-mono text-[10px]">{metric.averageLatency || 0} ms</TableCell>
                <TableCell className="font-mono text-[10px]">{metric.maxLatency} ms</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
export default ApiUsageTable;
