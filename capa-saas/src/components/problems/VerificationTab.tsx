"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Verification {
  isEffective?: boolean;
  notes?: string;
  method?: string;
  verifiedAt?: string;
  verifiedBy?: { id: string; name: string };
}

interface User { id: string; name: string; department: string; }

const VERIFICATION_METHODS = [
  { value: "inspection", label: "Physical Inspection" },
  { value: "testing", label: "Testing / Measurement" },
  { value: "audit", label: "Process Audit" },
  { value: "monitoring", label: "Statistical Monitoring" },
  { value: "review", label: "Document Review" },
];

export function VerificationTab({ problemId, verification, status, onSaved }: {
  problemId: string;
  verification?: Verification;
  status: string;
  onSaved: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    isEffective: verification?.isEffective ?? null as boolean | null,
    notes: verification?.notes ?? "",
    method: verification?.method ?? "",
    verifiedById: verification?.verifiedBy?.id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers);
  }, []);

  const canVerify = status === "pending_verification" || status === "in_progress" || status === "action_planned";

  async function save() {
    setSaving(true);
    await fetch(`/api/problems/${problemId}/verification`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  return (
    <div className="space-y-4">
      {verification?.verifiedAt && !canVerify && (
        <div className={cn(
          "flex items-center gap-4 rounded-xl border p-5",
          verification.isEffective
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        )}>
          {verification.isEffective
            ? <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
            : <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />}
          <div>
            <p className={cn("text-base font-bold", verification.isEffective ? "text-emerald-800" : "text-red-800")}>
              {verification.isEffective ? "Corrective Action Effective — Problem Closed" : "Corrective Action Not Effective"}
            </p>
            {verification.verifiedBy && (
              <p className="text-sm text-slate-500 mt-0.5">Verified by {verification.verifiedBy.name}</p>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Effectiveness Verification
          </CardTitle>
          <CardDescription>
            Confirm that the corrective actions taken have resolved the problem permanently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Verification Method</Label>
            <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
              <SelectTrigger><SelectValue placeholder="How was effectiveness verified?" /></SelectTrigger>
              <SelectContent>
                {VERIFICATION_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Verification Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Describe the evidence and observations from the verification activity..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Verified By</Label>
            <Select value={form.verifiedById} onValueChange={(v) => setForm((f) => ({ ...f, verifiedById: v }))}>
              <SelectTrigger><SelectValue placeholder="Select verifier" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Effectiveness Result</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isEffective: true }))}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  form.isEffective === true
                    ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-emerald-300"
                )}
              >
                <CheckCircle2 className={cn("h-7 w-7", form.isEffective === true ? "text-emerald-600" : "text-slate-300")} />
                <div className="text-center">
                  <p className={cn("text-sm font-semibold", form.isEffective === true ? "text-emerald-700" : "text-slate-500")}>Effective</p>
                  <p className="text-xs text-slate-400 mt-0.5">Problem resolved, close CAPA</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isEffective: false }))}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  form.isEffective === false
                    ? "border-red-400 bg-red-50 ring-2 ring-red-500/20"
                    : "border-slate-200 hover:border-red-300"
                )}
              >
                <XCircle className={cn("h-7 w-7", form.isEffective === false ? "text-red-500" : "text-slate-300")} />
                <div className="text-center">
                  <p className={cn("text-sm font-semibold", form.isEffective === false ? "text-red-700" : "text-slate-500")}>Not Effective</p>
                  <p className="text-xs text-slate-400 mt-0.5">Requires further action</p>
                </div>
              </button>
            </div>
          </div>

          {form.isEffective === true && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">⚡ This will automatically close the CAPA record.</p>
              <p className="text-xs text-emerald-600 mt-1">The problem status will be updated to Closed upon saving.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={save}
              disabled={saving || form.isEffective === null}
              variant={form.isEffective === true ? "success" : "default"}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {saved ? "Saved!" : saving ? "Saving..." : "Save Verification"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
