"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, User, AlertTriangle, CheckCircle2,
  Clock, MessageSquare, ChevronRight, Loader2, Send, Edit2,
  Package, MapPin, Hash, ClipboardList, Target, ShieldCheck,
  ChevronDown, MoreHorizontal, Trash2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, SeverityBadge } from "@/components/problems/StatusBadge";
import { RootCauseTab } from "@/components/problems/RootCauseTab";
import { ActionsTab } from "@/components/problems/ActionsTab";
import { VerificationTab } from "@/components/problems/VerificationTab";
import { formatDate, formatDateTime, STATUS_CONFIG, daysUntilDue } from "@/lib/utils";
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
  batchNumber?: string;
  detectedAt: string;
  dueDate?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; name: string; department: string; role: string };
  assignee?: { id: string; name: string; department: string; role: string };
  rootCause?: {
    why1?: string; why2?: string; why3?: string; why4?: string; why5?: string;
    rootCause?: string; category?: string;
  };
  actions: Array<{
    id: string; title: string; description: string; type: string;
    status: string; priority: string; dueDate?: string; completedAt?: string;
    assignee: { id: string; name: string; department: string };
  }>;
  comments: Array<{
    id: string; content: string; createdAt: string;
    user: { id: string; name: string; department: string };
  }>;
  verification?: {
    isEffective?: boolean; notes?: string; method?: string; verifiedAt?: string;
    verifiedBy?: { id: string; name: string };
  };
}

const LIFECYCLE_STEPS = [
  { key: "reported", label: "Reported", icon: ClipboardList },
  { key: "investigating", label: "Investigate", icon: Target },
  { key: "action_planned", label: "Plan", icon: ClipboardList },
  { key: "in_progress", label: "Implement", icon: Clock },
  { key: "pending_verification", label: "Verify", icon: ShieldCheck },
  { key: "closed", label: "Closed", icon: CheckCircle2 },
];

function LifecycleBar({ status }: { status: string }) {
  const currentStep = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.step ?? 1;
  return (
    <div className="flex items-center gap-0">
      {LIFECYCLE_STEPS.map((step, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isPending = stepNum > currentStep;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                isDone ? "border-emerald-500 bg-emerald-500 text-white" :
                isCurrent ? "border-indigo-600 bg-indigo-600 text-white" :
                "border-slate-200 bg-white text-slate-400"
              )}>
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNum}
              </div>
              <span className={cn(
                "text-[10px] font-medium whitespace-nowrap",
                isCurrent ? "text-indigo-700" : isDone ? "text-emerald-600" : "text-slate-400"
              )}>
                {step.label}
              </span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-1 mb-4 transition-colors",
                isDone ? "bg-emerald-400" : "bg-slate-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CommentSection({ problemId, comments, onRefresh }: {
  problemId: string;
  comments: Problem["comments"];
  onRefresh: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    await fetch(`/api/problems/${problemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, userId: comments[0]?.user?.id ?? "" }),
    });
    setText("");
    setSending(false);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="h-8 w-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                {c.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">{c.user.name}</span>
                  <span className="text-xs text-slate-400">{c.user.department}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
          QE
        </div>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={send} disabled={!text.trim() || sending}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const refresh = useCallback(() => {
    fetch(`/api/problems/${id}`)
      .then((r) => r.json())
      .then((d) => { setProblem(d); setLoading(false); });
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <AppLayout>
        <Header title="Loading..." />
        <div className="p-8 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!problem) {
    return (
      <AppLayout>
        <Header title="Problem Not Found" />
        <div className="p-8 text-center">
          <p className="text-slate-500">This problem record does not exist.</p>
          <Link href="/problems"><Button className="mt-4">Back to Problems</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const days = daysUntilDue(problem.dueDate);
  const isOverdue = days !== null && days < 0 && problem.status !== "closed";

  const tabCounts: Record<string, number | undefined> = {
    actions: problem.actions.length || undefined,
    comments: problem.comments.length || undefined,
  };

  return (
    <AppLayout>
      <Header
        title={problem.title}
        description={`CAPA-${problem.id.slice(-6).toUpperCase()} · ${problem.area}`}
        actions={
          <Link href="/problems">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        {/* Lifecycle Progress */}
        <Card className="overflow-hidden">
          <CardContent className="px-8 py-6">
            <LifecycleBar status={problem.status} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rootcause">Root Cause Analysis</TabsTrigger>
                <TabsTrigger value="actions">
                  Actions {tabCounts.actions ? `(${tabCounts.actions})` : ""}
                </TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments {tabCounts.comments ? `(${tabCounts.comments})` : ""}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { icon: MapPin, label: "Production Area", value: problem.area },
                          { icon: Hash, label: "Category", value: problem.category.charAt(0).toUpperCase() + problem.category.slice(1) },
                          { icon: Package, label: "Part Number", value: problem.partNumber ?? "—" },
                          { icon: Package, label: "Batch / Lot", value: problem.batchNumber ?? "—" },
                          { icon: Calendar, label: "Detected", value: formatDate(problem.detectedAt) },
                          { icon: Calendar, label: "Reported", value: formatDate(problem.createdAt) },
                          { icon: Calendar, label: "Due Date", value: problem.dueDate ? formatDate(problem.dueDate) : "—" },
                          { icon: Calendar, label: "Closed", value: problem.closedAt ? formatDate(problem.closedAt) : "—" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                            <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-400">{label}</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-red-800">Overdue</p>
                          <p className="text-xs text-red-600">This problem is {Math.abs(days!)} day{Math.abs(days!) !== 1 ? "s" : ""} past its target resolution date.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Root Cause Tab */}
              <TabsContent value="rootcause">
                <RootCauseTab
                  problemId={problem.id}
                  rootCause={problem.rootCause}
                  onSaved={refresh}
                />
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions">
                <ActionsTab
                  problemId={problem.id}
                  actions={problem.actions}
                  onRefresh={refresh}
                />
              </TabsContent>

              {/* Verification Tab */}
              <TabsContent value="verification">
                <VerificationTab
                  problemId={problem.id}
                  verification={problem.verification}
                  status={problem.status}
                  onSaved={refresh}
                />
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments">
                <Card>
                  <CardContent className="p-6">
                    <CommentSection
                      problemId={problem.id}
                      comments={problem.comments}
                      onRefresh={refresh}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusBadge status={problem.status} />
                <SeverityBadge severity={problem.severity} />
              </CardContent>
            </Card>

            {/* People */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Reporter</p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white flex-shrink-0">
                      {problem.reporter.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{problem.reporter.name}</p>
                      <p className="text-xs text-slate-400">{problem.reporter.department}</p>
                    </div>
                  </div>
                </div>
                {problem.assignee && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Assignee</p>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white flex-shrink-0">
                        {problem.assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{problem.assignee.name}</p>
                        <p className="text-xs text-slate-400">{problem.assignee.department}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Reported", date: problem.createdAt, color: "bg-slate-400" },
                  { label: "Due Date", date: problem.dueDate, color: isOverdue ? "bg-red-500" : "bg-amber-400" },
                  { label: "Closed", date: problem.closedAt, color: "bg-emerald-500" },
                ].filter((t) => t.date).map((t) => (
                  <div key={t.label} className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${t.color}`} />
                    <div>
                      <p className="text-xs text-slate-400">{t.label}</p>
                      <p className="text-sm font-medium text-slate-700">{formatDate(t.date)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions quick summary */}
            {problem.actions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Action Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(() => {
                    const done = problem.actions.filter((a) => a.status === "completed" || a.status === "verified").length;
                    const total = problem.actions.length;
                    const pct = Math.round((done / total) * 100);
                    return (
                      <>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{done} / {total} completed</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
