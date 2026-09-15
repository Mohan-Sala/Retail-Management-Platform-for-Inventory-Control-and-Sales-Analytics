import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface BackgroundJobsTableProps {
  jobs: any[];
  onToggle: (name: string, action: string) => void;
}

/**
 * @desc Lists background jobs with actions to pause and resume individual schedule sweeps
 */
export function BackgroundJobsTable({
  jobs,
  onToggle,
}: BackgroundJobsTableProps) {
  return (
    <Card className="border border-border/40 overflow-hidden rounded-xl shadow-sm text-left text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker Name</TableHead>
            <TableHead>Run State</TableHead>
            <TableHead>Failures</TableHead>
            <TableHead>Last Executed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                No active background workers registered.
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow key={job.name}>
                <TableCell className="font-semibold text-foreground">{job.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    job.status === "paused" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                  }`}>
                    {job.status}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[10px]">{job.failureCount || 0}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(job.lastRun).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {job.status === "paused" ? (
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-emerald-500" onClick={() => onToggle(job.name, "resume")}>
                      <Play className="h-3.5 w-3.5 mr-1" /> Resume
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 px-2.5 text-amber-500" onClick={() => onToggle(job.name, "pause")}>
                      <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
export default BackgroundJobsTable;
