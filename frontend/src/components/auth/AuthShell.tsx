import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden overflow-hidden md:block">
        <div className="absolute inset-0 gradient-primary" />
        <div className="pointer-events-none absolute inset-0 gradient-mesh mix-blend-overlay opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur"><ShoppingBag className="h-4 w-4" /></div>
            ShopSense
          </Link>
          <div>
            <h2 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-3xl font-bold leading-tight">Operate every vendor, every SKU, every rupee — in one view.</h2>
            <p className="mt-3 max-w-md text-sm text-white/80">Join hundreds of marketplace operators using ShopSense to close months faster and grow smarter.</p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {[["₹4.8Cr", "GMV / month"], ["98.2%", "Payout accuracy"], ["<200ms", "Query speed"]].map(([v, l]) => (
                <div key={l}><div className="text-xl font-semibold">{v}</div><div className="text-white/70">{l}</div></div>
              ))}
            </div>
          </div>
          <div className="text-xs text-white/70">© {new Date().getFullYear()} ShopSense</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={"w-full " + (wide ? "max-w-lg" : "max-w-sm")}>
          <div className="mb-6 md:hidden">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground"><ShoppingBag className="h-4 w-4" /></div>
              ShopSense
            </Link>
          </div>
          <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
