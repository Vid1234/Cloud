"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_OPTIONS, AREA_OPTIONS } from "@/lib/utils";

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical", desc: "Immediate safety risk or production shutdown", color: "text-red-600" },
  { value: "high", label: "High", desc: "Significant quality impact, requires urgent attention", color: "text-orange-600" },
  { value: "medium", label: "Medium", desc: "Moderate impact, standard resolution timeline", color: "text-amber-600" },
  { value: "low", label: "Low", desc: "Minor issue, can be scheduled for resolution", color: "text-green-600" },
];

interface User {
  id: string;
  name: string;
  department: string;
  role: string;
}

export default function NewProblemPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "",
    category: "",
    area: "",
    partNumber: "",
    batchNumber: "",
    dueDate: "",
    reporterId: "",
    assigneeId: "",
  });

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.severity) e.severity = "Severity is required";
    if (!form.category) e.category = "Category is required";
    if (!form.area) e.area = "Area is required";
    if (!form.reporterId) e.reporterId = "Reporter is required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, assigneeId: form.assigneeId === "none" ? "" : form.assigneeId }),
      });
      if (!res.ok) throw new Error("Failed");
      const problem = await res.json();
      router.push(`/problems/${problem.id}`);
    } catch {
      setLoading(false);
    }
  }

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  return (
    <AppLayout>
      <Header
        title="Report New Problem"
        description="Document a new quality or process issue"
        actions={
          <Link href="/problems">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Problem Details */}
          <Card>
            <CardHeader>
              <CardTitle>Problem Details</CardTitle>
              <CardDescription>Describe the issue clearly and concisely</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dimensional deviation on Part #X123 at Line A"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={errors.title ? "border-red-400" : ""}
                />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what happened, when it was detected, and what the impact is..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  className={errors.description ? "border-red-400" : ""}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>

              {/* Severity Selection */}
              <div className="space-y-2">
                <Label>Severity *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField("severity", opt.value)}
                      className={`text-left rounded-xl border p-3 transition-all duration-150 ${
                        form.severity === opt.value
                          ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-3.5 w-3.5 ${opt.color}`} />
                        <span className={`text-sm font-semibold ${opt.color}`}>{opt.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-snug">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.severity && <p className="text-xs text-red-500">{errors.severity}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>Categorize and locate the problem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                    <SelectTrigger className={errors.category ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Production Area *</Label>
                  <Select value={form.area} onValueChange={(v) => setField("area", v)}>
                    <SelectTrigger className={errors.area ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREA_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.area && <p className="text-xs text-red-500">{errors.area}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number</Label>
                  <Input
                    id="partNumber"
                    placeholder="e.g., X123-456"
                    value={form.partNumber}
                    onChange={(e) => setField("partNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch / Lot Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="e.g., LOT-2024-001"
                    value={form.batchNumber}
                    onChange={(e) => setField("batchNumber", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Who reported this and who should own it?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reported By *</Label>
                  <Select value={form.reporterId} onValueChange={(v) => setField("reporterId", v)}>
                    <SelectTrigger className={errors.reporterId ? "border-red-400" : ""}>
                      <SelectValue placeholder="Select reporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.reporterId && <p className="text-xs text-red-500">{errors.reporterId}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Select value={form.assigneeId} onValueChange={(v) => setField("assigneeId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} — {u.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Target Resolution Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <Link href="/problems">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Problem Report"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
