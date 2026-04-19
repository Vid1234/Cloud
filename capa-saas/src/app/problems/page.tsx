"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, SlidersHorizontal, AlertTriangle, Clock,
  ArrowRight, ChevronDown, X, Filter,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, SeverityBadge } from "@/components/problems/StatusBadge";
import { formatDate, daysUntilDue, STATUS_CONFIG, SEVERITY_CONFIG } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  category: string;
  area: string;
  partNumber?: string;
  dueDate?: string;
  createdAt: string;
  reporter: { id: string; name: string; department: string };
  assignee?: { id: string; name: string; department: string };
  _count: { actions: number; comments: number };
}

const STATUSES = ["all", "reported", "investigating", "action_planned", "in_progress", "pending_verification", "closed"];
const SEVERITIES = ["all", "critical", "high", "medium", "low"];
const CATEGORIES = ["all", "quality", "safety", "process", "equipment", "material", "other"];

function FilterChip({
  label, active, onClick,
}: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150",
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
      )}
    >
      {label}
    </button>
  );
}

function ProblemRow({ problem }: { problem: Problem }) {
  const days = daysUntilDue(problem.dueDate);
  const isOverdue = days !== null && days < 0 && problem.status !== "closed";
  const isDueSoon = days !== null && days >= 0 && days <= 3 && problem.status !== "closed";

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block"
    >
      <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
        {/* Severity indicator */}
        <div className={cn(
          "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
          problem.severity === "critical" ? "bg-red-500" :
          problem.severity === "high" ? "bg-orange-500" :
          problem.severity === "medium" ? "bg-amber-500" : "bg-green-500"
        )} />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                {problem.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{problem.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <SeverityBadge severity={problem.severity} />
              <StatusBadge status={problem.status} />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="font-medium text-slate-500">{problem.area}</span>
            <span>·</span>
            <span className="capitalize">{problem.category}</span>
            <span>·</span>
            <span>Reported by {problem.reporter.name}</span>
            {problem.assignee && (
              <>
                <span>·</span>
                <span>Assigned to {problem.assignee.name}</span>
              </>
            )}
            <span>·</span>
            <span>{formatDate(problem.createdAt)}</span>
            {problem._count.actions > 0 && (
              <>
                <span>·</span>
                <span>{problem._count.actions} action{problem._count.actions !== 1 ? "s" : ""}</span>
              </>
            )}
            {problem.dueDate && (
              <>
                <span>·</span>
                <span className={cn(
                  "flex items-center gap-1 font-medium",
                  isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-slate-400"
                )}>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  {isDueSoon && <Clock className="h-3 w-3" />}
                  {isOverdue ? `${Math.abs(days!)} days overdue` :
                   isDueSoon ? `Due in ${days} day${days !== 1 ? "s" : ""}` :
                   `Due ${formatDate(problem.dueDate)}`}
                </span>
              </>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
      </div>
    </Link>
  );
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");

  const fetchProblems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (severity !== "all") params.set("severity", severity);
    if (category !== "all") params.set("category", category);

    fetch(`/api/problems?${params}`)
      .then((r) => r.json())
      .then((d) => { setProblems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, status, severity, category]);

  useEffect(() => {
    const t = setTimeout(fetchProblems, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchProblems]);

  const activeFilterCount = [status !== "all", severity !== "all", category !== "all"].filter(Boolean).length;

  return (
    <AppLayout>
      <Header
        title="CAPA Records"
        description={`${problems.length} problem${problems.length !== 1 ? "s" : ""} found`}
        actions={
          <Link href="/problems/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Problem
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        {/* Search and filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, area, part number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Status</span>
              {STATUSES.map((s) => (
                <FilterChip
                  key={s}
                  label={s === "all" ? "All" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
                  active={status === s}
                  onClick={() => setStatus(s)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Severity</span>
              {SEVERITIES.map((s) => (
                <FilterChip
                  key={s}
                  label={s === "all" ? "All" : SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG]?.label ?? s}
                  active={severity === s}
                  onClick={() => setSeverity(s)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Category</span>
              {CATEGORIES.map((c) => (
                <FilterChip
                  key={c}
                  label={c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                  active={category === c}
                  onClick={() => setCategory(c)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Problems list */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-2 w-2 rounded-full bg-slate-200 mt-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : problems.length === 0 ? (
            <CardContent className="py-16 text-center">
              <Filter className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No problems match your filters</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => { setStatus("all"); setSeverity("all"); setCategory("all"); setSearch(""); }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          ) : (
            <div>
              {problems.map((p) => (
                <ProblemRow key={p.id} problem={p} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
