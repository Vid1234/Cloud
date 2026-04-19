"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, Plus,
  ArrowRight, AlertCircle, Activity, BarChart3, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, SeverityBadge } from "@/components/problems/StatusBadge";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  reported: "#94a3b8",
  investigating: "#3b82f6",
  action_planned: "#8b5cf6",
  in_progress: "#f59e0b",
  pending_verification: "#f97316",
  closed: "#10b981",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#22c55e",
};

interface DashboardData {
  stats: {
    total: number;
    open: number;
    overdue: number;
    closedThisMonth: number;
    closureRate: number;
  };
  byStatus: Array<{ status: string; _count: number }>;
  bySeverity: Array<{ severity: string; _count: number }>;
  byCategory: Array<{ category: string; _count: number }>;
  trend: Array<{ month: string; opened: number; closed: number }>;
  recentProblems: Array<{
    id: string;
    title: string;
    status: string;
    severity: string;
    area: string;
    createdAt: string;
    reporter: { name: string };
    assignee?: { name: string };
  }>;
}

function StatCard({
  title, value, subtitle, icon: Icon, color, trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            {trend && (
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <Header title="Dashboard" description="Overview of all CAPA activities" />
        <div className="p-8 grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const statusData = data?.byStatus.map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s._count,
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  })) ?? [];

  const severityData = data?.bySeverity.map((s) => ({
    name: s.severity,
    value: s._count,
    fill: SEVERITY_COLORS[s.severity] ?? "#94a3b8",
  })) ?? [];

  const categoryData = data?.byCategory.map((c) => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    count: c._count,
  })) ?? [];

  return (
    <AppLayout>
      <Header
        title="Dashboard"
        description="Overview of all CAPA activities"
        actions={
          <Link href="/problems/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Problem
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-8">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard
            title="Total Problems"
            value={data?.stats.total ?? 0}
            subtitle="All time"
            icon={BarChart3}
            color="bg-indigo-600"
          />
          <StatCard
            title="Open Issues"
            value={data?.stats.open ?? 0}
            subtitle="Requiring attention"
            icon={Activity}
            color="bg-amber-500"
          />
          <StatCard
            title="Overdue"
            value={data?.stats.overdue ?? 0}
            subtitle="Past due date"
            icon={AlertTriangle}
            color="bg-red-500"
          />
          <StatCard
            title="Closed This Month"
            value={data?.stats.closedThisMonth ?? 0}
            subtitle={`${data?.stats.closureRate ?? 0}% closure rate`}
            icon={CheckCircle2}
            color="bg-emerald-600"
            trend={data?.stats.closureRate ? `${data.stats.closureRate}% closure rate` : undefined}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Trend Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Problem Trend</CardTitle>
              <CardDescription>Opened vs. closed over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data?.trend ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="opened" stroke="#6366f1" strokeWidth={2} fill="url(#colorOpened)" name="Opened" />
                  <Area type="monotone" dataKey="closed" stroke="#10b981" strokeWidth={2} fill="url(#colorClosed)" name="Closed" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>By Status</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.fill }} />
                      <span className="capitalize text-slate-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Category Bar Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Problems by Category</CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Problems" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity */}
          <Card>
            <CardHeader>
              <CardTitle>By Severity</CardTitle>
              <CardDescription>Risk breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {severityData.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                      <span className="capitalize font-medium text-slate-700">{s.name}</span>
                    </div>
                    <span className="text-slate-500 text-xs">{s.value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${data?.stats.total ? (s.value / data.stats.total) * 100 : 0}%`,
                        background: s.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Problems */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Recent Problems</CardTitle>
              <CardDescription>Latest CAPA records</CardDescription>
            </div>
            <Link href="/problems">
              <Button variant="ghost" size="sm" className="gap-1 text-indigo-600 hover:text-indigo-700">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {data?.recentProblems.map((p) => (
                <Link
                  key={p.id}
                  href={`/problems/${p.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.area} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <SeverityBadge severity={p.severity} />
                    <StatusBadge status={p.status} />
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              ))}
              {(!data?.recentProblems || data.recentProblems.length === 0) && (
                <div className="px-6 py-12 text-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No problems recorded yet.</p>
                  <Link href="/problems/new">
                    <Button size="sm" className="mt-4">Report First Problem</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
