"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrackCount, SubmissionBucket, TeamSizeCount } from "@/lib/queries";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

export function TrackChart({ data }: { data: TrackCount[] }) {
  // Show the top tracks so labels stay legible.
  const top = data.slice(0, 12);
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, top.length * 34)}>
      <BarChart
        data={top}
        layout="vertical"
        margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="track"
          width={200}
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickFormatter={(v: string) => (v.length > 30 ? v.slice(0, 29) + "…" : v)}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {top.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimelineChart({ data }: { data: SubmissionBucket[] }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="hour"
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickFormatter={fmt}
          minTickGap={40}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(l) => fmt(l as string)}
          formatter={(v) => [v as number, "Total submitted"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--chart-4)"
          strokeWidth={2}
          fill="url(#fillCount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TeamSizeChart({ data }: { data: TeamSizeCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 8, right: 24, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="size"
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickFormatter={(v) => `${v}`}
        />
        <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "var(--muted)" }}
          labelFormatter={(l) => `${l} member${l === 1 ? "" : "s"}`}
          formatter={(v) => [v as number, "Projects"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--chart-2)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
