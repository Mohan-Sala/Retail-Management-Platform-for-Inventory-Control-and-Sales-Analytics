import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Boxes, LineChart, ShieldCheck, Sparkles, Store, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopSense — The command center for multi-vendor commerce" },
      { name: "description", content: "Real-time analytics, inventory, and vendor operations built for high-growth marketplaces." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-70" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 md:px-6 md:pt-24">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5"><Sparkles className="h-3 w-3" /> Now with cohort forecasting</Badge>
            <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-4xl font-bold tracking-tight md:text-6xl">
              The command center for <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">multi-vendor commerce</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              ShopSense unifies vendors, inventory, transactions, and analytics into one polished workspace — so operations teams ship faster and finance teams close cleaner.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild><Link to="/register">Start free trial <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/login">Sign in</Link></Button>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">No credit card required · 14-day workspace · SOC 2 friendly</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="relative mx-auto mt-16 max-w-5xl">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10">
              <div className="rounded-xl bg-gradient-to-br from-muted to-background p-6">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    { l: "GMV (30d)", v: "₹4.82 Cr", d: "+18.4%" },
                    { l: "Active vendors", v: "342", d: "+12" },
                    { l: "Orders", v: "18,204", d: "+9.1%" },
                    { l: "Payouts", v: "₹3.9 Cr", d: "settled" },
                  ].map((k) => (
                    <div key={k.l} className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs text-muted-foreground">{k.l}</div>
                      <div className="mt-1 text-xl font-semibold">{k.v}</div>
                      <div className="text-xs text-success">{k.d}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-56 rounded-lg border border-border bg-card p-4">
                  <svg viewBox="0 0 600 180" className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.35" />
                        <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,140 C60,110 120,90 180,80 C240,70 300,110 360,70 C420,40 480,60 540,30 L600,20 L600,180 L0,180 Z" fill="url(#g)" />
                    <path d="M0,140 C60,110 120,90 180,80 C240,70 300,110 360,70 C420,40 480,60 540,30 L600,20" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-3xl font-bold tracking-tight md:text-4xl">Every marketplace lever, in one place</h2>
          <p className="mt-3 text-muted-foreground">Purpose-built modules for admins and vendors — designed like the tools your team already loves.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { i: Store, t: "Vendor operations", d: "Onboard, verify GST, set commission, and monitor performance across 25+ signals." },
            { i: Boxes, t: "Inventory intelligence", d: "Multi-warehouse tracking, reorder alerts, and stock history without spreadsheets." },
            { i: Wallet, t: "Transactions & payouts", d: "Reconcile every rupee. Filter, export, and audit — CSV and PDF ready." },
            { i: LineChart, t: "Analytics that ship", d: "Revenue, sales, category and cohort views. Build reports in seconds." },
            { i: ShieldCheck, t: "Roles you trust", d: "Separate admin and vendor consoles with per-role routing and permissions." },
            { i: Zap, t: "Built for scale", d: "Type-safe, responsive, and dark-mode ready. Enterprise-grade from day one." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><f.i className="h-5 w-5" /></div>
              <div className="mt-4 font-semibold">{f.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="analytics" className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:px-6">
          <div>
            <Badge variant="outline" className="mb-3"><BarChart3 className="mr-1 h-3 w-3" /> Analytics</Badge>
            <h3 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-3xl font-bold tracking-tight">Decisions your finance team can defend</h3>
            <p className="mt-3 text-muted-foreground">Slice revenue by vendor, category, and channel. Compare periods, export to PDF, and ship weekly reports without engineering.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Real-time revenue and payout dashboards", "Best-selling products and vendor leaderboards", "Reorder and low-stock alerting", "One-click CSV & PDF exports"].map((x) => (
                <li key={x} className="flex items-start gap-2"><div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "Top vendor", v: "Nova & Co.", s: "₹42.1L" },
                { k: "Best category", v: "Electronics", s: "31%" },
                { k: "Refund rate", v: "1.8%", s: "-0.4pp" },
                { k: "Avg. order", v: "₹1,842", s: "+₹120" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-border bg-background p-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
                  <div className="mt-1 text-lg font-semibold">{s.v}</div>
                  <div className="text-xs text-success">{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
        <h3 style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }} className="text-3xl font-bold tracking-tight md:text-4xl">Bring your team on today</h3>
        <p className="mt-3 text-muted-foreground">Free 14-day workspace. Invite vendors, import products, and see your analytics light up.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild><Link to="/register">Create workspace</Link></Button>
          <Button size="lg" variant="outline" asChild><Link to="/login">Sign in</Link></Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground md:flex-row md:px-6">
          <div>© {new Date().getFullYear()} ShopSense. Crafted for marketplaces.</div>
          <div>Made with care · v1.0</div>
        </div>
      </footer>
    </div>
  );
}
