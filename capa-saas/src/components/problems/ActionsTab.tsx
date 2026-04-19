"use client";

import { useState, useEffect } from "react";
import {
  Plus, CheckCircle2, Clock, AlertTriangle, Loader2, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate, daysUntilDue } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Action {
  id: string; title: string; description: string; type: string;
  status: string; priority: string; dueDate?: string; completedAt?: string;
  assignee: { id: string; name: string; department: string };
}

interface User {
  id: string; name: string; department: string;
}

const ACTION_TYPES = [
  { value: "immediate", label: "Immediate Containment", color: "text-red-600 bg-red-50 border-red-200" },
  { value: "corrective", label: "Corrective Action", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { value: "preventive", label: "Preventive Action", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
];

const STATUS_STYLES: Record<string, string> = {
  open: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  verified: "bg-indigo-50 text-indigo-700",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

function ActionCard({ action, problemId, onRefresh }: {
  action: Action; problemId: string; onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const days = daysUntilDue(action.dueDate);
  const isOverdue = days !== null && days < 0 && action.status !== "completed" && action.status !== "verified";

  const nextStatus: Record<string, string> = {
    open: "in_progress",
    in_progress: "completed",
    completed: "verified",
  };

  async function advance() {
    const next = nextStatus[action.status];
    if (!next) return;
    setUpdating(true);
    await fetch(`/api/problems/${problemId}/actions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: action.id, status: next }),
    });
    setUpdating(false);
    onRefresh();
  }

  const typeConfig = ACTION_TYPES.find((t) => t.value === action.type);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {typeConfig && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", typeConfig.color)}>
                {typeConfig.label}
              </span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[action.status] ?? STATUS_STYLES.open)}>
              {action.status.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[action.priority])} />
              <span className="text-xs text-slate-400 capitalize">{action.priority}</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-900">{action.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{action.description}</p>

          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-[8px] font-bold text-white">
                {action.assignee.name[0]}
              </div>
              <span>{action.assignee.name}</span>
            </div>
            {action.dueDate && (
              <span className={cn("flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                {isOverdue ? `${Math.abs(days!)}d overdue` : `Due ${formatDate(action.dueDate)}`}
              </span>
            )}
            {action.completedAt && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Done {formatDate(action.completedAt)}
              </span>
            )}
          </div>
        </div>

        {action.status !== "verified" && (
          <Button
            size="sm"
            variant={action.status === "completed" ? "success" : action.status === "in_progress" ? "default" : "outline"}
            onClick={advance}
            disabled={updating}
            className="flex-shrink-0"
          >
            {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
             action.status === "open" ? "Start" :
             action.status === "in_progress" ? "Mark Done" : "Verify"}
          </Button>
        )}
        {action.status === "verified" && (
          <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-medium flex-shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            Verified
          </div>
        )}
      </div>
    </div>
  );
}

export function ActionsTab({ problemId, actions, onRefresh }: {
  problemId: string;
  actions: Action[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "", priority: "medium", dueDate: "", assigneeId: "",
  });

  useEffect(() => {
    if (open) fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, [open]);

  async function submit() {
    if (!form.title || !form.description || !form.type || !form.assigneeId) return;
    setSaving(true);
    await fetch(`/api/problems/${problemId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setOpen(false);
    setForm({ title: "", description: "", type: "", priority: "medium", dueDate: "", assigneeId: "" });
    onRefresh();
  }

  const grouped = {
    immediate: actions.filter((a) => a.type === "immediate"),
    corrective: actions.filter((a) => a.type === "corrective"),
    preventive: actions.filter((a) => a.type === "preventive"),
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {actions.filter((a) => a.status === "completed" || a.status === "verified").length} of {actions.length} actions completed
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Action
        </Button>
      </div>

      {actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No actions defined yet</p>
            <p className="text-xs text-slate-400 mt-1">Add corrective and preventive actions to resolve this problem</p>
            <Button size="sm" className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Add First Action
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {ACTION_TYPES.map(({ value, label }) => {
            const group = grouped[value as keyof typeof grouped];
            if (group.length === 0) return null;
            return (
              <div key={value}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
                <div className="space-y-3">
                  {group.map((a) => (
                    <ActionCard key={a.id} action={a} problemId={problemId} onRefresh={onRefresh} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Action</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2 space-y-4">
            <div className="space-y-2">
              <Label>Action Type *</Label>
              <div className="grid grid-cols-3 gap-2">
                {ACTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={cn(
                      "rounded-lg border p-2 text-xs font-medium text-center transition-all",
                      form.type === t.value ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Action title" />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe what needs to be done" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee *</Label>
              <Select value={form.assigneeId} onValueChange={(v) => setForm((f) => ({ ...f, assigneeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} — {u.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving || !form.title || !form.type || !form.assigneeId}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
