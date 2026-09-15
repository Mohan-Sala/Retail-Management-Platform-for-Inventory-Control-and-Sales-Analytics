import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Card } from "@/components/ui/card";

const CHART_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

const tooltipStyle = {
  contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

export function RevenueAreaChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4"><div className="text-sm font-semibold">Revenue trend</div><div className="text-xs text-muted-foreground">Last 12 months</div></div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#rev)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function VendorSalesBarChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4"><div className="text-sm font-semibold">Top vendors by revenue</div><div className="text-xs text-muted-foreground">Current cycle</div></div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: -8, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="var(--color-chart-2)" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4"><div className="text-sm font-semibold">Category distribution</div><div className="text-xs text-muted-foreground">Products by category</div></div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function OrdersLineChart({ data }: { data: { month: string; orders: number }[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4"><div className="text-sm font-semibold">Monthly transactions</div><div className="text-xs text-muted-foreground">Order volume trend</div></div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: -8, right: 8, top: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
          <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
          <Tooltip {...tooltipStyle} />
          <Line type="monotone" dataKey="orders" stroke="var(--color-chart-3)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
