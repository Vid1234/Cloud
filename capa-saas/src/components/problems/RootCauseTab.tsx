"use client";

import { useState } from "react";
import { Loader2, Save, ChevronRight, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RootCause {
  why1?: string; why2?: string; why3?: string; why4?: string; why5?: string;
  rootCause?: string; category?: string;
}

const RCA_CATEGORIES = [
  { value: "man", label: "Man (Human Factor)" },
  { value: "machine", label: "Machine / Equipment" },
  { value: "method", label: "Method / Process" },
  { value: "material", label: "Material" },
  { value: "environment", label: "Environment" },
  { value: "measurement", label: "Measurement" },
];

function WhyStep({
  number, value, onChange, placeholder, previousWhy,
}: {
  number: number;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  previousWhy?: string;
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
            value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
          )}>
            {number}
          </div>
          {number < 5 && (
            <div className={cn("w-0.5 h-8 mt-1", value ? "bg-indigo-200" : "bg-slate-100")} />
          )}
        </div>
        <div className="flex-1 space-y-1.5 pb-4">
          <Label className="text-sm font-semibold text-slate-700">Why #{number}</Label>
          {previousWhy && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              Because: {previousWhy.slice(0, 80)}{previousWhy.length > 80 ? "..." : ""}
            </p>
          )}
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

export function RootCauseTab({
  problemId, rootCause, onSaved,
}: {
  problemId: string;
  rootCause?: RootCause;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    why1: rootCause?.why1 ?? "",
    why2: rootCause?.why2 ?? "",
    why3: rootCause?.why3 ?? "",
    why4: rootCause?.why4 ?? "",
    why5: rootCause?.why5 ?? "",
    rootCause: rootCause?.rootCause ?? "",
    category: rootCause?.category ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/problems/${problemId}/rootcause`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  }

  const filledWhys = [form.why1, form.why2, form.why3, form.why4, form.why5].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>5-Why Analysis</CardTitle>
          <CardDescription>
            Repeatedly ask "Why?" to drill down to the root cause. Fill in as many levels as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <WhyStep number={1} value={form.why1} onChange={(v) => setForm({ ...form, why1: v })}
            placeholder="Why did the problem occur?" />
          <WhyStep number={2} value={form.why2} onChange={(v) => setForm({ ...form, why2: v })}
            placeholder="Why did that happen?" previousWhy={form.why1} />
          <WhyStep number={3} value={form.why3} onChange={(v) => setForm({ ...form, why3: v })}
            placeholder="Why did that happen?" previousWhy={form.why2} />
          <WhyStep number={4} value={form.why4} onChange={(v) => setForm({ ...form, why4: v })}
            placeholder="Why did that happen?" previousWhy={form.why3} />
          <WhyStep number={5} value={form.why5} onChange={(v) => setForm({ ...form, why5: v })}
            placeholder="Why did that happen?" previousWhy={form.why4} />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{filledWhys} of 5 levels completed</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={cn("h-1.5 w-6 rounded-full", n <= filledWhys ? "bg-indigo-500" : "bg-slate-200")} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Root Cause Conclusion
          </CardTitle>
          <CardDescription>Summarize the true root cause identified through the analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Root Cause Statement</Label>
            <Textarea
              value={form.rootCause}
              onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
              placeholder="State the fundamental root cause in clear, actionable terms..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Root Cause Category (Ishikawa / Fishbone)</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {RCA_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved!" : saving ? "Saving..." : "Save Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
