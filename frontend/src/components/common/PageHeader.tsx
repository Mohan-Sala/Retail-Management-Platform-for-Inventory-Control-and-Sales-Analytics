import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border p-12 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return <Link to={to} className="mb-4 inline-flex text-xs text-muted-foreground hover:text-foreground">← {label}</Link>;
}
